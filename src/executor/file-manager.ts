// One Agent Corp — File Manager
// Security layer for file operations: restricts writes to projects/ directory only

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Resolve the project root (two levels up from src/executor/) */
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const ALLOWED_WRITE_BASE = path.join(PROJECT_ROOT, 'projects');

export class FileManager {
  /**
   * Returns true only if the given filePath is inside the `projects/` directory
   * relative to the project root.
   */
  allowedWrite(filePath: string): boolean {
    const resolved = path.resolve(filePath);
    const relative = path.relative(ALLOWED_WRITE_BASE, resolved);
    // relative must not start with '..' and must not be absolute
    return !relative.startsWith('..') && !path.isAbsolute(relative);
  }

  /**
   * Writes content to filePath — only if it is within the `projects/` allowlist.
   * Creates intermediate directories as needed.
   */
  async safeWrite(filePath: string, content: string): Promise<void> {
    if (!this.allowedWrite(filePath)) {
      throw new Error(
        `Write denied: path "${filePath}" is outside the allowed projects/ directory.`
      );
    }
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
  }

  /**
   * Reads a file. No path restrictions for reads.
   */
  async safeRead(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (err) {
      throw new Error(
        `Read failed for "${filePath}": ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  /**
   * Lists all files recursively for a given projectId under `projects/{projectId}/`.
   */
  async listProjectFiles(projectId: string): Promise<string[]> {
    const projectDir = path.join(ALLOWED_WRITE_BASE, projectId);
    return this._listRecursive(projectDir);
  }

  /**
   * Ensures the `projects/{projectId}/` directory exists and returns its absolute path.
   */
  async ensureProjectDir(projectId: string): Promise<string> {
    const projectDir = path.join(ALLOWED_WRITE_BASE, projectId);
    await fs.mkdir(projectDir, { recursive: true });
    return projectDir;
  }

  /** Recursively collect all file paths under a directory. */
  private async _listRecursive(dir: string): Promise<string[]> {
    let entries: import('fs').Dirent[];
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return [];
    }

    const results: string[] = [];
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const nested = await this._listRecursive(fullPath);
        results.push(...nested);
      } else {
        results.push(fullPath);
      }
    }
    return results;
  }
}
