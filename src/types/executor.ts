// One Agent Corp — Executor Types
// Types for claude -p subprocess execution

/** Options for a single call to the claude CLI subprocess. */
export interface ClaudeCallOptions {
  prompt: string;
  model: string;
  timeout?: number;
  onStream?: (chunk: string) => void;
  maxRetries?: number;
}

/** Result returned after a claude CLI subprocess completes. */
export interface ClaudeCallResult {
  output: string;
  exitCode: number;
  duration: number;
  model: string;
  promptHash: string;
  timestamp: string;
  error?: string;
}

/** A single SSE-style event emitted during streaming execution. */
export interface StreamEvent {
  type: 'data' | 'error' | 'end';
  chunk?: string;
  error?: string;
  timestamp: string;
}

/** Structured log entry written for every claude CLI call (JSON to stdout). */
export interface ExecutorLog {
  timestamp: string;
  department: string;
  model: string;
  promptHash: string;
  durationMs: number;
  outputLength: number;
  success: boolean;
  error?: string;
}
