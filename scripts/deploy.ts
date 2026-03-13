import { config as dotenvConfig } from 'dotenv';
import { SSHClient } from '../src/devops/ssh-client.js';
import { DockerBuilder } from '../src/devops/docker-builder.js';
import { HealthChecker } from '../src/devops/health-checker.js';
import { join } from 'path';
import { mkdtemp, rm, access } from 'fs/promises';
import { constants } from 'fs';
import { tmpdir, homedir } from 'os';

dotenvConfig();

// ── CLI argument parsing ──────────────────────────────────────────────────────

function parseArgs(): { projectId: string; env: 'staging' | 'production' } {
  const args = process.argv.slice(2);
  let projectId = '';
  let env: 'staging' | 'production' = 'production';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--project' && args[i + 1]) {
      projectId = args[++i];
    } else if (args[i] === '--env' && args[i + 1]) {
      const val = args[++i];
      if (val !== 'staging' && val !== 'production') {
        console.error(`[error] --env must be "staging" or "production", got "${val}"`);
        process.exit(1);
      }
      env = val;
    }
  }

  if (!projectId) {
    console.error('[error] --project <id> is required');
    console.error('Usage: npx tsx scripts/deploy.ts --project <id> --env <staging|production>');
    process.exit(1);
  }

  return { projectId, env };
}

// ── Logging helpers ───────────────────────────────────────────────────────────

let currentStep = 0;
const totalSteps = 9;

function step(name: string): void {
  currentStep++;
  console.log(`\n[${currentStep}/${totalSteps}] ${name}`);
  console.log('─'.repeat(50));
}

function log(msg: string): void {
  console.log(`    ${msg}`);
}

function success(msg: string): void {
  console.log(`    ✓ ${msg}`);
}

function warn(msg: string): void {
  console.log(`    ⚠ ${msg}`);
}

// ── Main deploy logic ─────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const { projectId, env } = parseArgs();

  const VPS_HOST = process.env.VPS_HOST;
  const VPS_USER = process.env.VPS_USER ?? 'root';
  const SSH_KEY_PATH =
    process.env.SSH_KEY_PATH ?? join(homedir(), '.ssh', 'oac_deploy_key');
  const APP_PORT = process.env.APP_PORT ?? '3000';

  if (!VPS_HOST) {
    console.error('[error] VPS_HOST is not set in .env');
    process.exit(1);
  }

  const startTime = Date.now();

  console.log('\n══════════════════════════════════════════════════');
  console.log('  ONE AGENT CORP — Deploy Script');
  console.log('══════════════════════════════════════════════════');
  console.log(`  Project  : ${projectId}`);
  console.log(`  Env      : ${env}`);
  console.log(`  Target   : ${VPS_USER}@${VPS_HOST}`);
  console.log('══════════════════════════════════════════════════\n');

  const tag = `oac/${projectId}:latest`;
  const projectDir = `projects/${projectId}`;
  const remoteProjectDir = `/opt/oac-projects/${projectId}`;

  // ── STEP 1: Validate project directory ──────────────────────────────────────
  step('Validating project artifacts');
  try {
    await access(projectDir, constants.R_OK);
    success(`Project directory found: ${projectDir}`);
  } catch {
    console.error(`[error] Project directory not found: ${projectDir}`);
    console.error(`        Make sure projects/${projectId}/ exists with a Dockerfile`);
    process.exit(1);
  }

  // ── STEP 2: Load .env ────────────────────────────────────────────────────────
  step('Loading environment configuration');
  log(`VPS_HOST  = ${VPS_HOST}`);
  log(`VPS_USER  = ${VPS_USER}`);
  log(`SSH_KEY   = ${SSH_KEY_PATH}`);
  log(`APP_PORT  = ${APP_PORT}`);
  success('Configuration loaded');

  // ── STEP 3: Build Docker image ───────────────────────────────────────────────
  step(`Building Docker image: ${tag}`);
  const builder = new DockerBuilder();
  const buildResult = await builder.build(projectDir, tag);

  if (!buildResult.success) {
    console.error(`[error] Docker build failed: ${buildResult.error}`);
    process.exit(1);
  }
  success(`Image built${buildResult.imageId ? ` (ID: ${buildResult.imageId})` : ''}`);

  // ── STEP 4: Save image as tarball ────────────────────────────────────────────
  step('Saving Docker image as tarball');
  let tmpDir: string | undefined;
  const tarName = `${projectId}.tar`;
  let localTarPath: string;

  try {
    tmpDir = await mkdtemp(join(tmpdir(), 'oac-deploy-'));
    localTarPath = join(tmpDir, tarName);
    await builder.save(tag, localTarPath);
    success(`Tarball saved to ${localTarPath}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[error] Failed to save tarball: ${message}`);
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true }).catch(() => undefined);
    process.exit(1);
  }

  // ── STEP 5: Connect SSH & Upload tarball ─────────────────────────────────────
  step(`Connecting to VPS and uploading ${tarName}`);
  const ssh = new SSHClient();

  try {
    await ssh.connect({ host: VPS_HOST, username: VPS_USER, privateKeyPath: SSH_KEY_PATH });
    success(`SSH connected to ${VPS_USER}@${VPS_HOST}`);

    const remoteTarPath = `/tmp/${tarName}`;
    log(`Uploading ${tarName} via SFTP...`);
    await ssh.uploadFile(localTarPath!, remoteTarPath);
    success(`Tarball uploaded to ${remoteTarPath}`);

    // ── STEP 6: Load Docker image on VPS ────────────────────────────────────────
    step('Loading Docker image on VPS');
    log(`Running: docker load < ${remoteTarPath}`);
    await builder.load(remoteTarPath, ssh);
    success('Image loaded on VPS');

    // Clean up remote tar
    await ssh.exec(`rm -f ${remoteTarPath}`);

    // ── STEP 7: Upload docker-compose.yml ────────────────────────────────────────
    step('Uploading deployment configuration');
    const localComposePath = join(projectDir, 'docker-compose.yml');

    await ssh.exec(`mkdir -p ${remoteProjectDir}`);

    try {
      await access(localComposePath, constants.R_OK);
      await ssh.uploadFile(localComposePath, `${remoteProjectDir}/docker-compose.yml`);
      success(`docker-compose.yml uploaded to ${remoteProjectDir}/`);
    } catch {
      warn('No docker-compose.yml found — will use docker run');
    }

    // ── STEP 8: Start service on VPS ─────────────────────────────────────────────
    step('Starting service on VPS');

    const composeCheck = await ssh.exec(
      `test -f ${remoteProjectDir}/docker-compose.yml && echo yes || echo no`
    );

    if (composeCheck.stdout.trim() === 'yes') {
      log('Starting with docker-compose...');
      const upResult = await ssh.exec(
        `cd ${remoteProjectDir} && docker-compose up -d`
      );
      if (upResult.code !== 0) {
        throw new Error(`docker-compose up failed: ${upResult.stderr}`);
      }
      success('Service started via docker-compose');
    } else {
      log('Starting with docker run...');
      await ssh.exec(`docker stop oac-${projectId} 2>/dev/null || true`);
      await ssh.exec(`docker rm oac-${projectId} 2>/dev/null || true`);
      const runResult = await ssh.exec(
        `docker run -d --name oac-${projectId} --restart unless-stopped ` +
        `-p ${APP_PORT}:${APP_PORT} ` +
        `-e NODE_ENV=${env} ` +
        `${tag}`
      );
      if (runResult.code !== 0) {
        throw new Error(`docker run failed: ${runResult.stderr}`);
      }
      success(`Container oac-${projectId} started`);
    }

    // ── STEP 9: Health check ─────────────────────────────────────────────────────
    step(`Health check — polling for 60s`);
    const healthUrl = `http://${VPS_HOST}:${APP_PORT}/health`;
    log(`Polling: ${healthUrl}`);

    const healthChecker = new HealthChecker();
    const healthResult = await healthChecker.check(healthUrl, 10, 5000);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    if (healthResult.healthy) {
      success(
        `Health check passed! Status ${healthResult.statusCode}, ` +
        `response time ${healthResult.responseTime}ms`
      );
    } else {
      warn(`Health check failed: ${healthResult.error}`);
      warn('Service may still be starting — check manually');
    }

    // ── Deployment Report ─────────────────────────────────────────────────────────
    console.log('\n══════════════════════════════════════════════════');
    console.log('  DEPLOYMENT REPORT');
    console.log('══════════════════════════════════════════════════');
    console.log(`  Project      : ${projectId}`);
    console.log(`  Environment  : ${env}`);
    console.log(`  Image        : ${tag}`);
    console.log(`  URL          : http://${VPS_HOST}:${APP_PORT}`);
    console.log(`  Health URL   : ${healthUrl}`);
    console.log(`  Status       : ${healthResult.healthy ? 'HEALTHY' : 'DEPLOYED (check manually)'}`);
    console.log(`  Duration     : ${duration}s`);
    console.log('══════════════════════════════════════════════════\n');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`\n[error] Deployment failed: ${message}`);
    process.exit(1);
  } finally {
    ssh.disconnect();
    if (tmpDir) {
      await rm(tmpDir, { recursive: true, force: true }).catch(() => undefined);
    }
  }
}

main().catch((err) => {
  console.error('[fatal]', err);
  process.exit(1);
});
