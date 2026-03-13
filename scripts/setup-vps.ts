import { config as dotenvConfig } from 'dotenv';
import { SSHClient } from '../src/devops/ssh-client.js';
import { generateKeyPairSync } from 'crypto';
import { writeFile, readFile, access, mkdir } from 'fs/promises';
import { constants } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

dotenvConfig();

const VPS_HOST = process.env.VPS_HOST;
const VPS_USER = process.env.VPS_USER ?? 'root';
const SSH_DIR = join(homedir(), '.ssh');
const KEY_PATH = join(SSH_DIR, 'oac_deploy_key');
const KEY_PUB_PATH = join(SSH_DIR, 'oac_deploy_key.pub');

function log(msg: string): void {
  console.log(`[setup-vps] ${msg}`);
}

function logStep(step: string): void {
  console.log(`\n========================================`);
  console.log(`  ${step}`);
  console.log(`========================================`);
}

async function ensureSSHKey(): Promise<string> {
  logStep('SSH Key Setup');

  // Check if key already exists
  try {
    await access(KEY_PATH, constants.R_OK);
    log(`SSH key already exists at ${KEY_PATH}`);
    const pubKey = await readFile(KEY_PUB_PATH, 'utf-8');
    return pubKey.trim();
  } catch {
    // Key does not exist, generate it
    log(`Generating new RSA-4096 SSH key pair at ${KEY_PATH}...`);

    const { privateKey, publicKey } = generateKeyPairSync('rsa', {
      modulusLength: 4096,
      publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
    });

    // Convert public key to OpenSSH format
    const { publicKey: sshPublicKey } = generateKeyPairSync('rsa', {
      modulusLength: 4096,
      publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
    });
    void sshPublicKey;

    // Re-generate using ssh format
    const { privateKey: privKey, publicKey: pubKey } = generateKeyPairSync('rsa', {
      modulusLength: 4096,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    void privKey;
    void pubKey;
    void privateKey;
    void publicKey;

    // Use OpenSSH format for actual keys
    const { privateKey: opensshPriv, publicKey: opensshPub } = generateKeyPairSync('rsa', {
      modulusLength: 4096,
      publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
      privateKeyEncoding: {
        type: 'pkcs1',
        format: 'pem',
      },
    });

    // Ensure .ssh directory exists
    await mkdir(SSH_DIR, { recursive: true });

    // Write private key
    await writeFile(KEY_PATH, opensshPriv, { mode: 0o600 });
    log(`Private key written to ${KEY_PATH}`);

    // Write public key (base64-encoded PKCS1 in OpenSSH-like format for display)
    const pubKeyPem = opensshPub;
    await writeFile(KEY_PUB_PATH, pubKeyPem, { mode: 0o644 });
    log(`Public key written to ${KEY_PUB_PATH}`);

    return pubKeyPem.trim();
  }
}

const NGINX_CONFIG = `
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /health {
        access_log off;
        proxy_pass http://localhost:3000/health;
        proxy_set_header Host $host;
    }
}
`.trimStart();

async function runSetupCommands(ssh: SSHClient): Promise<void> {
  logStep('System Update');
  log('Running apt-get update && upgrade...');
  const updateResult = await ssh.exec('apt-get update -y && apt-get upgrade -y');
  if (updateResult.code !== 0) {
    throw new Error(`System update failed: ${updateResult.stderr}`);
  }
  log('System updated successfully');

  logStep('Docker Compose Installation');
  const checkCompose = await ssh.exec('docker-compose --version 2>/dev/null || docker compose version 2>/dev/null');
  if (checkCompose.code !== 0 || (!checkCompose.stdout.includes('version'))) {
    log('Installing docker-compose plugin...');
    const installResult = await ssh.exec(
      'apt-get install -y docker-compose-plugin || ' +
      'curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" ' +
      '-o /usr/local/bin/docker-compose && chmod +x /usr/local/bin/docker-compose'
    );
    if (installResult.code !== 0) {
      log(`Warning: docker-compose installation returned code ${installResult.code}`);
    } else {
      log('docker-compose installed');
    }
  } else {
    log('docker-compose already installed: ' + checkCompose.stdout.trim());
  }

  logStep('Project Directory Setup');
  log('Creating /opt/oac-projects/...');
  const mkdirResult = await ssh.exec('mkdir -p /opt/oac-projects');
  if (mkdirResult.code !== 0) {
    throw new Error(`Failed to create /opt/oac-projects: ${mkdirResult.stderr}`);
  }
  log('/opt/oac-projects/ created');

  logStep('Nginx Configuration');
  log('Writing nginx reverse proxy config...');
  // Escape the config for shell injection
  const escapedConfig = NGINX_CONFIG.replace(/'/g, "'\\''");
  const writeNginxResult = await ssh.exec(
    `mkdir -p /opt/oac-projects && cat > /opt/oac-projects/nginx.conf << 'NGINX_EOF'\n${NGINX_CONFIG}\nNGINX_EOF`
  );
  void escapedConfig;
  if (writeNginxResult.code !== 0) {
    log(`Warning: nginx config write returned code ${writeNginxResult.code}: ${writeNginxResult.stderr}`);
  } else {
    log('nginx.conf written to /opt/oac-projects/nginx.conf');
  }

  logStep('Firewall Configuration (UFW)');
  log('Configuring ufw firewall rules...');
  const ufwCheck = await ssh.exec('which ufw');
  if (ufwCheck.code === 0) {
    await ssh.exec('ufw allow 22/tcp');
    await ssh.exec('ufw allow 80/tcp');
    await ssh.exec('ufw allow 443/tcp');
    await ssh.exec('ufw --force enable');
    await ssh.exec('ufw default deny incoming');
    await ssh.exec('ufw default allow outgoing');
    // Re-allow SSH after default deny
    await ssh.exec('ufw allow 22/tcp');
    log('Firewall rules applied: allow 22, 80, 443; deny all else');

    const ufwStatus = await ssh.exec('ufw status');
    log('UFW Status:\n' + ufwStatus.stdout);
  } else {
    log('ufw not found — skipping firewall setup');
  }
}

async function main(): Promise<void> {
  console.log('\n========================================');
  console.log('  ONE AGENT CORP — VPS Setup Script');
  console.log('========================================\n');

  if (!VPS_HOST) {
    console.error('[error] VPS_HOST is not set in .env file');
    console.error('        Create a .env file with VPS_HOST=<ip-or-hostname>');
    process.exit(1);
  }

  log(`Target VPS: ${VPS_USER}@${VPS_HOST}`);

  // Step 1: Ensure SSH key
  const publicKey = await ensureSSHKey();

  console.log('\n----------------------------------------');
  console.log('  PUBLIC KEY (add to VPS authorized_keys)');
  console.log('----------------------------------------');
  console.log(publicKey);
  console.log('----------------------------------------\n');
  console.log('  To add to VPS, run on the VPS:');
  console.log(`  mkdir -p ~/.ssh && echo "<public-key>" >> ~/.ssh/authorized_keys`);
  console.log('----------------------------------------\n');

  // Step 2: Connect to VPS
  logStep('Connecting to VPS');
  log(`Connecting to ${VPS_USER}@${VPS_HOST} using ${KEY_PATH}...`);

  const ssh = new SSHClient();

  try {
    await ssh.connect({
      host: VPS_HOST,
      username: VPS_USER,
      privateKeyPath: KEY_PATH,
    });
    log('SSH connection established');

    // Step 3: Run setup commands
    await runSetupCommands(ssh);

    // Print success
    logStep('Setup Complete!');
    console.log(`\n  VPS is ready for deployments`);
    console.log(`  Connection string: ssh -i ${KEY_PATH} ${VPS_USER}@${VPS_HOST}`);
    console.log(`  Projects directory: /opt/oac-projects/`);
    console.log(`\n  To deploy a project:`);
    console.log(`  npx tsx scripts/deploy.ts --project <id> --env production\n`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`\n[error] Setup failed: ${message}`);
    console.error('\nMake sure:');
    console.error(`  1. The VPS host ${VPS_HOST} is reachable`);
    console.error(`  2. The SSH key at ${KEY_PATH} is added to the VPS authorized_keys`);
    console.error(`  3. User "${VPS_USER}" has sudo/root access`);
    process.exit(1);
  } finally {
    ssh.disconnect();
  }
}

main().catch((err) => {
  console.error('[fatal]', err);
  process.exit(1);
});
