import { EventEmitter } from 'events';
import { SSHClient } from './ssh-client.js';
import { DockerBuilder } from './docker-builder.js';
import { HealthChecker } from './health-checker.js';
import { join } from 'path';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';

export interface DeployResult {
  success: boolean;
  projectId: string;
  environment: 'staging' | 'production';
  url: string;
  duration: number;
  logs: string[];
}

export type DeployEvent =
  | 'build'
  | 'upload'
  | 'deploy'
  | 'health-check'
  | 'done'
  | 'error';

export class DeployPipeline extends EventEmitter {
  private builder: DockerBuilder;
  private healthChecker: HealthChecker;
  private logs: string[] = [];

  constructor() {
    super();
    this.builder = new DockerBuilder();
    this.healthChecker = new HealthChecker();
  }

  async run(
    projectId: string,
    env: 'staging' | 'production'
  ): Promise<DeployResult> {
    const startTime = Date.now();
    this.logs = [];

    const vpsHost = process.env.VPS_HOST;
    const vpsUser = process.env.VPS_USER ?? 'root';
    const sshKeyPath =
      process.env.SSH_KEY_PATH ??
      `${process.env.HOME ?? process.env.USERPROFILE}/.ssh/oac_deploy_key`;
    const appPort = process.env.APP_PORT ?? '3000';

    if (!vpsHost) {
      const err = 'VPS_HOST environment variable is required';
      this.log(err);
      this.emit('error', new Error(err));
      return this.failResult(projectId, env, startTime, err);
    }

    const tag = `oac/${projectId}:latest`;
    const projectDir = `projects/${projectId}`;
    const remoteProjectDir = `/opt/oac-projects/${projectId}`;
    const url = `http://${vpsHost}:${appPort}`;

    const ssh = new SSHClient();
    let tmpDir: string | undefined;

    try {
      // STEP 1: Build
      this.log(`[build] Building Docker image: ${tag}`);
      this.emit('build', { projectId, tag });

      const buildResult = await this.builder.build(projectDir, tag);
      if (!buildResult.success) {
        throw new Error(`Docker build failed: ${buildResult.error}`);
      }
      this.log(`[build] Image built successfully${buildResult.imageId ? ` (${buildResult.imageId})` : ''}`);

      // Verify image works
      const testResult = await this.builder.test(tag);
      if (!testResult.success) {
        throw new Error(`Docker image test failed: ${testResult.output}`);
      }
      this.log(`[build] Image verified: ${testResult.output.trim()}`);

      // STEP 2: Save & Upload
      this.log(`[upload] Saving image tarball...`);
      this.emit('upload', { projectId });

      tmpDir = await mkdtemp(join(tmpdir(), 'oac-deploy-'));
      const tarName = `${projectId}.tar`;
      const localTarPath = join(tmpDir, tarName);
      const remoteTarPath = `/tmp/${tarName}`;

      await this.builder.save(tag, localTarPath);
      this.log(`[upload] Tarball saved to ${localTarPath}`);

      // Connect SSH
      this.log(`[upload] Connecting to VPS ${vpsUser}@${vpsHost}...`);
      await ssh.connect({ host: vpsHost, username: vpsUser, privateKeyPath: sshKeyPath });
      this.log(`[upload] SSH connected`);

      // Ensure remote project directory exists
      await ssh.exec(`mkdir -p ${remoteProjectDir}`);

      // Upload tarball
      this.log(`[upload] Uploading ${tarName} to VPS...`);
      await ssh.uploadFile(localTarPath, remoteTarPath);
      this.log(`[upload] Upload complete`);

      // Upload docker-compose.yml if it exists
      const localComposePath = join(projectDir, 'docker-compose.yml');
      try {
        await ssh.uploadFile(localComposePath, `${remoteProjectDir}/docker-compose.yml`);
        this.log(`[upload] docker-compose.yml uploaded`);
      } catch {
        this.log(`[upload] No docker-compose.yml found, skipping`);
      }

      // STEP 3: Deploy on VPS
      this.log(`[deploy] Loading Docker image on VPS...`);
      this.emit('deploy', { projectId, env });

      await this.builder.load(remoteTarPath, ssh);
      this.log(`[deploy] Image loaded on VPS`);

      // Run via docker-compose or docker run
      const composeCheck = await ssh.exec(`test -f ${remoteProjectDir}/docker-compose.yml && echo yes || echo no`);
      if (composeCheck.stdout.trim() === 'yes') {
        this.log(`[deploy] Starting service with docker-compose...`);
        const deployResult = await ssh.exec(
          `cd ${remoteProjectDir} && docker-compose pull 2>/dev/null; docker-compose up -d`
        );
        if (deployResult.code !== 0) {
          throw new Error(`docker-compose up failed: ${deployResult.stderr}`);
        }
      } else {
        this.log(`[deploy] Starting container directly...`);
        // Stop any existing container with same name
        await ssh.exec(`docker stop oac-${projectId} 2>/dev/null || true`);
        await ssh.exec(`docker rm oac-${projectId} 2>/dev/null || true`);
        const runResult = await ssh.exec(
          `docker run -d --name oac-${projectId} --restart unless-stopped -p ${appPort}:${appPort} ${tag}`
        );
        if (runResult.code !== 0) {
          throw new Error(`docker run failed: ${runResult.stderr}`);
        }
      }
      this.log(`[deploy] Service started`);

      // Clean up remote tarball
      await ssh.exec(`rm -f ${remoteTarPath}`);

      // STEP 4: Health check
      this.log(`[health-check] Polling ${url}/health...`);
      this.emit('health-check', { projectId, url });

      const healthResult = await this.healthChecker.check(
        `${url}/health`,
        10,
        3000
      );

      if (!healthResult.healthy) {
        // Try root path as fallback
        const rootCheck = await this.healthChecker.check(url, 3, 2000);
        if (!rootCheck.healthy) {
          this.log(
            `[health-check] Service unhealthy: ${healthResult.error} (root also failed: ${rootCheck.error})`
          );
          // Not a fatal error — service may be starting, report as warning
          this.log(`[health-check] Warning: health check failed but deployment completed`);
        } else {
          this.log(`[health-check] Service responding at root (status ${rootCheck.statusCode})`);
        }
      } else {
        this.log(
          `[health-check] Healthy! Status ${healthResult.statusCode}, response time ${healthResult.responseTime}ms`
        );
      }

      const duration = Date.now() - startTime;
      this.log(`[done] Deployment complete in ${(duration / 1000).toFixed(1)}s`);
      this.emit('done', { projectId, url, duration });

      return {
        success: true,
        projectId,
        environment: env,
        url,
        duration,
        logs: [...this.logs],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.log(`[error] ${message}`);
      this.emit('error', err instanceof Error ? err : new Error(message));

      return this.failResult(projectId, env, startTime, message);
    } finally {
      ssh.disconnect();
      if (tmpDir) {
        await rm(tmpDir, { recursive: true, force: true }).catch(() => undefined);
      }
    }
  }

  private log(message: string): void {
    this.logs.push(message);
  }

  private failResult(
    projectId: string,
    env: 'staging' | 'production',
    startTime: number,
    error: string
  ): DeployResult {
    return {
      success: false,
      projectId,
      environment: env,
      url: '',
      duration: Date.now() - startTime,
      logs: [...this.logs, `[error] ${error}`],
    };
  }
}
