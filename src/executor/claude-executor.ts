// One Agent Corp — Claude Executor
// Core subprocess wrapper for calling `claude -p` as a child process

import { execa } from 'execa';
import { createHash } from 'crypto';
import type { ClaudeCallOptions, ClaudeCallResult, ExecutorLog, StreamEvent } from '../types/executor.js';

const DEFAULT_TIMEOUT_MS = 300_000; // 300 seconds
const MAX_CONCURRENT = 3;

/** Internal semaphore to enforce max concurrent processes */
let _activeCalls = 0;
const _waitQueue: Array<() => void> = [];

function _acquireSlot(): Promise<void> {
  return new Promise((resolve) => {
    if (_activeCalls < MAX_CONCURRENT) {
      _activeCalls++;
      resolve();
    } else {
      _waitQueue.push(() => {
        _activeCalls++;
        resolve();
      });
    }
  });
}

function _releaseSlot(): void {
  _activeCalls--;
  const next = _waitQueue.shift();
  if (next) next();
}

function _hashPrompt(prompt: string): string {
  return createHash('sha256').update(prompt).digest('hex').slice(0, 16);
}

function _emitLog(log: ExecutorLog): void {
  process.stdout.write(JSON.stringify({ logType: 'executor-log', ...log }) + '\n');
}

function _emitStreamEvent(event: StreamEvent): void {
  process.stdout.write(JSON.stringify({ logType: 'stream-event', ...event }) + '\n');
}

/** Core subprocess wrapper. Calls `pi -p "prompt" -m "model"` as a child process. */
export class ClaudeExecutor {
  /**
   * Execute a prompt via the pi CLI subprocess.
   * Supports optional streaming via onStream callback in options.
   */
  async execute(options: ClaudeCallOptions): Promise<ClaudeCallResult> {
    const { prompt, model, timeout = DEFAULT_TIMEOUT_MS, onStream, maxRetries = 0 } = options;
    const promptHash = _hashPrompt(prompt);
    const startTs = Date.now();
    const timestamp = new Date().toISOString();

    await _acquireSlot();

    let attempt = 0;
    let lastError: Error | undefined;

    while (attempt <= maxRetries) {
      try {
        const result = await this._runOnce({
          prompt,
          model,
          timeout,
          onStream,
          promptHash,
          timestamp,
          startTs,
        });
        _releaseSlot();
        return result;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        attempt++;
        if (attempt > maxRetries) break;
      }
    }

    _releaseSlot();

    const duration = Date.now() - startTs;

    _emitLog({
      timestamp: new Date().toISOString(),
      department: 'executor',
      model,
      promptHash,
      durationMs: duration,
      outputLength: 0,
      success: false,
      error: lastError?.message,
    });

    return {
      output: '',
      exitCode: 1,
      duration,
      model,
      promptHash,
      timestamp,
      error: lastError?.message ?? 'Unknown error',
    };
  }

  private async _runOnce(opts: {
    prompt: string;
    model: string;
    timeout: number;
    onStream?: (chunk: string) => void;
    promptHash: string;
    timestamp: string;
    startTs: number;
  }): Promise<ClaudeCallResult> {
    const { prompt, model, timeout, onStream, promptHash, timestamp, startTs } = opts;

    _emitStreamEvent({
      type: 'data',
      chunk: `[start] model=${model} promptHash=${promptHash}`,
      timestamp: new Date().toISOString(),
    });

    // MAS / Token Optimizer: Inject role and prompt concise output
    const optimizedPrompt = `[Role: Executor] Action: Execute the following task and provide concise output. Task: ${prompt}`;
    const args: string[] = ['-p', optimizedPrompt, '--model', model];

    // If streaming callback provided, use stream-json output format
    if (onStream) {
      args.push('--output-format', 'stream-json');
    }

    // Remove CLAUDECODE to allow nested pi -p calls from within sessions
    const env = { ...process.env };
    delete env['CLAUDECODE'];

    const proc = execa('pi', args, {
      timeout,
      all: true,
      env,
      stdin: 'ignore',
    });

    let output = '';

    if (onStream && proc.all) {
      for await (const chunk of proc.all) {
        const chunkStr = chunk.toString();
        output += chunkStr;
        onStream(chunkStr);
        _emitStreamEvent({
          type: 'data',
          chunk: chunkStr,
          timestamp: new Date().toISOString(),
        });
      }
    }

    const result = await proc;

    if (!onStream) {
      output = result.stdout ?? '';
    }

    const duration = Date.now() - startTs;
    const exitCode = result.exitCode ?? 0;

    _emitStreamEvent({
      type: 'end',
      timestamp: new Date().toISOString(),
    });

    _emitLog({
      timestamp: new Date().toISOString(),
      department: 'executor',
      model,
      promptHash,
      durationMs: duration,
      outputLength: output.length,
      success: exitCode === 0,
    });

    return {
      output,
      exitCode,
      duration,
      model,
      promptHash,
      timestamp,
    };
  }
}
