import { execa } from 'execa';
import type { SSHClient } from './ssh-client.js';

export interface BuildResult {
  success: boolean;
  imageId?: string;
  error?: string;
}

export interface TestResult {
  success: boolean;
  output: string;
}

export class DockerBuilder {
  async build(projectDir: string, tag: string): Promise<BuildResult> {
    try {
      const result = await execa('docker', ['build', '-t', tag, projectDir], {
        reject: false,
        all: true,
      });

      if (result.exitCode !== 0) {
        return {
          success: false,
          error: result.stderr || result.stdout || 'docker build failed with no output',
        };
      }

      // Extract image ID from build output
      const lines = (result.stdout || '').split('\n');
      let imageId: string | undefined;
      for (const line of lines.reverse()) {
        const match = line.match(/Successfully built ([a-f0-9]+)/);
        if (match) {
          imageId = match[1];
          break;
        }
        // BuildKit format: writing image sha256:...
        const shaMatch = line.match(/sha256:([a-f0-9]{12,64})/);
        if (shaMatch) {
          imageId = shaMatch[1].substring(0, 12);
          break;
        }
      }

      return { success: true, imageId };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: `docker build exception: ${message}` };
    }
  }

  async test(tag: string): Promise<TestResult> {
    try {
      const result = await execa(
        'docker',
        ['run', '--rm', '--entrypoint', 'node', tag, '--version'],
        { reject: false, all: true }
      );

      const output = result.stdout || result.stderr || '';

      if (result.exitCode !== 0) {
        return { success: false, output: output || 'Container test failed' };
      }

      return { success: true, output };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, output: `docker run exception: ${message}` };
    }
  }

  async push(tag: string, registry?: string): Promise<boolean> {
    const fullTag = registry ? `${registry}/${tag}` : tag;

    try {
      // Tag the image if a registry is provided
      if (registry) {
        const tagResult = await execa('docker', ['tag', tag, fullTag], { reject: false });
        if (tagResult.exitCode !== 0) {
          return false;
        }
      }

      const result = await execa('docker', ['push', fullTag], { reject: false });
      return result.exitCode === 0;
    } catch {
      return false;
    }
  }

  async prune(): Promise<void> {
    try {
      await execa('docker', ['image', 'prune', '-f'], { reject: false });
    } catch {
      // Prune failures are non-fatal
    }
  }

  async save(tag: string, outputPath: string): Promise<void> {
    try {
      const result = await execa('docker', ['save', '-o', outputPath, tag], { reject: false });
      if (result.exitCode !== 0) {
        const errMsg = result.stderr || 'docker save failed';
        throw new Error(`Failed to save image "${tag}" to "${outputPath}": ${errMsg}`);
      }
    } catch (err) {
      if (err instanceof Error && err.message.startsWith('Failed to save')) {
        throw err;
      }
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`docker save exception for "${tag}": ${message}`);
    }
  }

  async load(tarPath: string, remoteClient: SSHClient): Promise<void> {
    const result = await remoteClient.exec(`docker load < ${tarPath}`);
    if (result.code !== 0) {
      throw new Error(
        `Failed to load Docker image on remote from "${tarPath}": ${result.stderr || result.stdout}`
      );
    }
  }
}
