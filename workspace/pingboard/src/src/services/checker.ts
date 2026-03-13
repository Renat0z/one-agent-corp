```typescript
import type { ProbeResult } from '../types/index.js';
import { getConfig } from '../config.js';

export async function probe(url: string, timeoutMs?: number): Promise<ProbeResult> {
  const timeout = timeoutMs ?? getConfig().CHECK_TIMEOUT_MS;
  const start   = performance.now();

  try {
    const controller = new AbortController();
    const timer      = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method:  'HEAD',
      signal:  controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'Pingboard/1.0 (+https://pingboard.app/bot)' },
    });

    clearTimeout(timer);
    const elapsed = Math.round(performance.now() - start);

    // 4xx = app is UP (it responded). 5xx = app is DOWN.
    return {
      is_up:            response.status < 500,
      status_code:      response.status,
      response_time_ms: elapsed,
      error:            null,
    };
  } catch (err: unknown) {
    const elapsed = Math.round(performance.now() - start);
    let error = 'unknown_error';

    if (err instanceof Error) {
      if (err.name === 'AbortError')                             error = `timeout_${timeout}ms`;
      else if (err.message.includes('ENOTFOUND'))               error = 'dns_failure';
      else if (err.message.includes('ECONNREFUSED'))            error = 'connection_refused';
      else if (/CERT|SSL|TLS/i.test(err.message))              error = 'ssl_error';
      else                                                       error = err.message.slice(0, 80);
    }

    return { is_up: false, status_code: null, response_time_ms: elapsed, error };
  }
}

/**
 * Returns TRUE only at the exact threshold crossing.
 * Avoids alert spam on every subsequent failure after the threshold is reached.
 */
export function shouldAlert(consecutiveFailures: number, threshold = 2): boolean {
  return consecutiveFailures === threshold;
}
```