import { NodeSSH } from 'node-ssh';
import { readFile, access } from 'fs/promises';
import { constants } from 'fs';

export interface SSHConfig {
  host: string;
  username: string;
  privateKeyPath: string;
  passphrase?: string;
}

export class SSHClient {
  private ssh: NodeSSH;
  private connected: boolean = false;

  constructor() {
    this.ssh = new NodeSSH();
  }

  async connect(config: SSHConfig): Promise<void> {
    try {
      await access(config.privateKeyPath, constants.R_OK);
    } catch {
      throw new Error(`SSH private key not readable at: ${config.privateKeyPath}`);
    }

    const privateKey = await readFile(config.privateKeyPath, 'utf-8');

    try {
      await this.ssh.connect({
        host: config.host,
        username: config.username,
        privateKey,
        passphrase: config.passphrase,
        readyTimeout: 30000,
        timeout: 30000,
      });
      this.connected = true;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`SSH connection failed to ${config.username}@${config.host}: ${message}`);
    }
  }

  disconnect(): void {
    if (this.connected) {
      this.ssh.dispose();
      this.connected = false;
    }
  }

  async exec(command: string): Promise<{ stdout: string; stderr: string; code: number }> {
    if (!this.connected) {
      throw new Error('SSH client is not connected. Call connect() first.');
    }

    try {
      const result = await this.ssh.execCommand(command, {
        execOptions: { pty: false },
      });

      return {
        stdout: result.stdout ?? '',
        stderr: result.stderr ?? '',
        code: result.code ?? 0,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`SSH exec failed for command "${command}": ${message}`);
    }
  }

  async uploadFile(localPath: string, remotePath: string): Promise<void> {
    if (!this.connected) {
      throw new Error('SSH client is not connected. Call connect() first.');
    }

    try {
      await this.ssh.putFile(localPath, remotePath);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`SSH upload failed: ${localPath} -> ${remotePath}: ${message}`);
    }
  }

  async uploadDirectory(localPath: string, remotePath: string): Promise<void> {
    if (!this.connected) {
      throw new Error('SSH client is not connected. Call connect() first.');
    }

    try {
      const failed: Array<{ filename: string; error: Error }> = [];
      await this.ssh.putDirectory(localPath, remotePath, {
        recursive: true,
        concurrency: 4,
        validate: () => true,
        tick: (_localFile, _remoteFile, error) => {
          if (error) {
            failed.push({ filename: _localFile, error });
          }
        },
      });

      if (failed.length > 0) {
        const names = failed.map((f) => f.filename).join(', ');
        throw new Error(`Some files failed to upload: ${names}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`SSH upload directory failed: ${localPath} -> ${remotePath}: ${message}`);
    }
  }

  async execStream(command: string, onData: (data: string) => void): Promise<number> {
    if (!this.connected) {
      throw new Error('SSH client is not connected. Call connect() first.');
    }

    return new Promise<number>((resolve, reject) => {
      this.ssh.connection?.exec(command, (err, stream) => {
        if (err) {
          reject(new Error(`SSH execStream failed for "${command}": ${err.message}`));
          return;
        }

        let exitCode = 0;

        stream.stdout.on('data', (data: Buffer) => {
          onData(data.toString('utf-8'));
        });

        stream.stderr.on('data', (data: Buffer) => {
          onData(data.toString('utf-8'));
        });

        stream.on('close', (code: number) => {
          exitCode = code ?? 0;
          resolve(exitCode);
        });

        stream.on('error', (streamErr: Error) => {
          reject(new Error(`SSH stream error for "${command}": ${streamErr.message}`));
        });
      });
    });
  }

  get isConnected(): boolean {
    return this.connected;
  }
}
