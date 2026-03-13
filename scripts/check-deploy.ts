import { config as dotenvConfig } from 'dotenv';
import { SSHClient } from '../src/devops/ssh-client.js';
import { HealthChecker } from '../src/devops/health-checker.js';
import { join } from 'path';
import { homedir } from 'os';

dotenvConfig();

// ── Types ─────────────────────────────────────────────────────────────────────

interface DockerContainer {
  ID: string;
  Image: string;
  Command: string;
  CreatedAt: string;
  RunningFor: string;
  Ports: string;
  Status: string;
  Size: string;
  Names: string;
  Labels: string;
  Mounts: string;
  Networks: string;
}

interface ServiceStatus {
  name: string;
  image: string;
  status: string;
  ports: string;
  healthy?: boolean;
  healthUrl?: string;
  responseTime?: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function log(msg: string): void {
  console.log(msg);
}

function padEnd(str: string, len: number): string {
  return str.length >= len ? str.substring(0, len - 1) + '…' : str.padEnd(len);
}

function extractPort(ports: string): string | undefined {
  // Typical format: "0.0.0.0:3000->3000/tcp"
  const match = ports.match(/0\.0\.0\.0:(\d+)->/);
  return match ? match[1] : undefined;
}

function parseDockerPsJson(output: string): DockerContainer[] {
  const lines = output
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const containers: DockerContainer[] = [];
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line) as DockerContainer;
      containers.push(parsed);
    } catch {
      // Some docker versions output one JSON object per line, others output an array
      try {
        const parsed = JSON.parse(`[${lines.join(',')}]`) as DockerContainer[];
        return parsed;
      } catch {
        // skip malformed lines
      }
    }
  }

  return containers;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const VPS_HOST = process.env.VPS_HOST;
  const VPS_USER = process.env.VPS_USER ?? 'root';
  const SSH_KEY_PATH =
    process.env.SSH_KEY_PATH ?? join(homedir(), '.ssh', 'oac_deploy_key');

  console.log('\n══════════════════════════════════════════════════');
  console.log('  ONE AGENT CORP — Service Health Check');
  console.log('══════════════════════════════════════════════════\n');

  if (!VPS_HOST) {
    console.error('[error] VPS_HOST is not set in .env');
    process.exit(1);
  }

  log(`Connecting to ${VPS_USER}@${VPS_HOST}...`);

  const ssh = new SSHClient();

  try {
    await ssh.connect({ host: VPS_HOST, username: VPS_USER, privateKeyPath: SSH_KEY_PATH });
    log('SSH connected\n');

    // Get running containers
    log('Fetching running containers...');
    const psResult = await ssh.exec(
      'docker ps --format \'{"ID":"{{.ID}}","Image":"{{.Image}}","Status":"{{.Status}}","Ports":"{{.Ports}}","Names":"{{.Names}}"}\''
    );

    if (psResult.code !== 0) {
      throw new Error(`docker ps failed: ${psResult.stderr}`);
    }

    const containers = parseDockerPsJson(psResult.stdout);

    if (containers.length === 0) {
      log('No running containers found on VPS');
      return;
    }

    log(`Found ${containers.length} running container(s)\n`);

    // Check health endpoints
    const healthChecker = new HealthChecker();
    const services: ServiceStatus[] = [];

    for (const container of containers) {
      const port = extractPort(container.Ports);
      let healthUrl: string | undefined;
      let healthy: boolean | undefined;
      let responseTime: number | undefined;

      if (port && VPS_HOST) {
        healthUrl = `http://${VPS_HOST}:${port}/health`;
        const result = await healthChecker.check(healthUrl, 2, 1000);
        healthy = result.healthy;
        responseTime = result.responseTime;
      }

      services.push({
        name: container.Names,
        image: container.Image,
        status: container.Status,
        ports: container.Ports || '—',
        healthy,
        healthUrl,
        responseTime,
      });
    }

    // ── Print table ───────────────────────────────────────────────────────────

    const COL_NAME = 22;
    const COL_IMAGE = 28;
    const COL_STATUS = 22;
    const COL_PORTS = 26;
    const COL_HEALTH = 10;

    const header =
      padEnd('NAME', COL_NAME) +
      padEnd('IMAGE', COL_IMAGE) +
      padEnd('STATUS', COL_STATUS) +
      padEnd('PORTS', COL_PORTS) +
      padEnd('HEALTH', COL_HEALTH);

    const divider = '─'.repeat(
      COL_NAME + COL_IMAGE + COL_STATUS + COL_PORTS + COL_HEALTH
    );

    console.log(divider);
    console.log(header);
    console.log(divider);

    for (const svc of services) {
      let healthLabel = '—';
      if (svc.healthy === true) {
        healthLabel = `OK (${svc.responseTime}ms)`;
      } else if (svc.healthy === false) {
        healthLabel = 'FAIL';
      }

      const row =
        padEnd(svc.name, COL_NAME) +
        padEnd(svc.image, COL_IMAGE) +
        padEnd(svc.status, COL_STATUS) +
        padEnd(svc.ports, COL_PORTS) +
        padEnd(healthLabel, COL_HEALTH);

      console.log(row);
    }

    console.log(divider);

    // Summary
    const healthyCount = services.filter((s) => s.healthy === true).length;
    const unhealthyCount = services.filter((s) => s.healthy === false).length;
    const unknownCount = services.filter((s) => s.healthy === undefined).length;

    console.log(`\nSummary: ${services.length} containers | ${healthyCount} healthy | ${unhealthyCount} failing | ${unknownCount} no health endpoint\n`);

    // Detail section for failing services
    const failing = services.filter((s) => s.healthy === false);
    if (failing.length > 0) {
      console.log('Failing services:');
      for (const svc of failing) {
        console.log(`  ${svc.name}: health endpoint ${svc.healthUrl ?? 'N/A'} not responding`);
      }
      console.log();
    }

    // Docker stats (lightweight)
    log('Fetching resource usage...');
    const statsResult = await ssh.exec(
      'docker stats --no-stream --format "{{.Name}}\tCPU: {{.CPUPerc}}\tMEM: {{.MemUsage}}"'
    );
    if (statsResult.code === 0 && statsResult.stdout.trim()) {
      console.log('\nResource Usage:');
      console.log('─'.repeat(60));
      for (const line of statsResult.stdout.split('\n').filter((l) => l.trim())) {
        console.log(`  ${line}`);
      }
      console.log();
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[error] ${message}`);
    process.exit(1);
  } finally {
    ssh.disconnect();
  }
}

main().catch((err) => {
  console.error('[fatal]', err);
  process.exit(1);
});
