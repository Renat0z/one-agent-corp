```typescript
import pLimit from 'p-limit';
import cron from 'node-cron';
import {
  getAllActiveChecks,
  getCheckById,
  getUserById,
  saveCheckResult,
  saveAlert,
  updateCheckStatus,
  getCheckResults,
  purgeOldResults,
} from './db/queries.js';
import { probe, shouldAlert }                               from './services/checker.js';
import { sendWhatsAppAlert, buildDownMessage, buildRecoveryMessage } from './services/alerter.js';
import { getConfig }                                        from './config.js';
import type { Check, CheckStatus }                          from './types/index.js';

// Prevents the same check from being dispatched twice simultaneously
const runningChecks = new Set<string>();

export function startScheduler(): void {
  const limit = pLimit(getConfig().CHECK_MAX_CONCURRENT);

  // Master tick — every 30 s, dispatch all overdue checks
  setInterval(() => {
    const now  = Math.floor(Date.now() / 1000);
    const due  = getAllActiveChecks().filter(c => {
      if (runningChecks.has(c.id))  return false; // already running
      if (!c.last_checked_at)       return true;  // never run
      return (now - c.last_checked_at) >= c.interval_seconds;
    });

    for (const check of due) {
      limit(() => _executeCheck(check.id)).catch(err =>
        console.error(`[scheduler] uncaught error for check ${check.id}:`, err),
      );
    }
  }, 30_000);

  // Daily cleanup — 03:00 BRT = 06:00 UTC
  cron.schedule('0 6 * * *', () => {
    const n = purgeOldResults(30);
    console.log(`[scheduler] purged ${n} stale results`);
  });

  console.log('[scheduler] started — master tick every 30s');
}

/**
 * Called after POST /api/checks.
 * No-op here: the master tick picks up new checks automatically via DB query.
 * Kept for API symmetry — swap to per-check cron in v2 without touching routes.
 */
export function registerCheck(_check: Check): void {}

/**
 * Called after DELETE /api/checks and PATCH (interval change).
 * Clears the running guard so the next tick doesn't skip it if mid-flight.
 */
export function unregisterCheck(id: string): void {
  runningChecks.delete(id);
}

/**
 * Called by POST /api/checks/:id/run (manual trigger).
 * Forces an immediate probe and returns the live result.
 */
export async function runCheckNow(checkId: string): Promise<{
  is_up:            boolean;
  status_code:      number | null;
  response_time_ms: number;
  error:            string | null;
  check:            Check | null;
}> {
  runningChecks.delete(checkId); // allow re-entry
  await _executeCheck(checkId);

  const check  = getCheckById(checkId);
  const latest = getCheckResults(checkId, 1)[0];

  return {
    is_up:            latest ? latest.is_up === 1 : false,
    status_code:      latest?.status_code      ?? null,
    response_time_ms: latest?.response_time_ms ?? 0,
    error:            latest?.error            ?? null,
    check,
  };
}

// ─── Core execution ──────────────────────────────────────────────────────────

async function _executeCheck(checkId: string): Promise<void> {
  if (runningChecks.has(checkId)) return;
  runningChecks.add(checkId);

  try {
    const check = getCheckById(checkId);
    if (!check) return; // deleted between dispatch and execution

    const result = await probe(check.url, check.timeout_ms);

    // Always persist raw probe data
    saveCheckResult({
      check_id:         checkId,
      is_up:            result.is_up,
      status_code:      result.status_code,
      response_time_ms: result.response_time_ms,
      error:            result.error,
    });

    if (!result.is_up) {
      const newFailures    = check.consecutive_failures + 1;
      const hitThreshold   = newFailures >= 2;       // require 2 consecutive failures
      const wasAlreadyDown = check.status === 'down';
      const newStatus: CheckStatus = hitThreshold ? 'down' : (check.status as CheckStatus);

      updateCheckStatus(checkId, newStatus, newFailures, !wasAlreadyDown && hitThreshold);

      // Alert only at the exact threshold crossing — never spam on repeated failures
      if (shouldAlert(newFailures) && !wasAlreadyDown) {
        await _sendDownAlert(check, result.response_time_ms, result.error);
      }
    } else {
      const wasDown = check.status === 'down';
      updateCheckStatus(checkId, 'up', 0, wasDown);

      if (wasDown) {
        await _sendRecoveryAlert(check);
      }
    }
  } catch (err) {
    console.error(`[scheduler] error executing check ${checkId}:`, err);
  } finally {
    runningChecks.delete(checkId);
  }
}

async function _sendDownAlert(
  check:      Check,
  responseMs: number,
  error:      string | null,
): Promise<void> {
  const user = getUserById(check.user_id);
  if (!user) return;

  const message = buildDownMessage(check.name, check.url, responseMs, error);
  const sent    = await sendWhatsAppAlert(user.whatsapp_number, message);

  saveAlert({ check_id: check.id, type: 'down', message, success: sent.success, messageId: sent.messageId });
  console.log(`[scheduler] ↓ DOWN "${check.name}" — whatsapp: ${sent.success}`);
}

async function _sendRecoveryAlert(check: Check): Promise<void> {
  const user = getUserById(check.user_id);
  if (!user) return;

  const now         = Math.floor(Date.now() / 1000);
  const downtimeSec = check.last_status_change_at ? now - check.last_status_change_at : 0;

  const message = buildRecoveryMessage(check.name, check.url, downtimeSec);
  const sent    = await sendWhatsAppAlert(user.whatsapp_number, message);

  saveAlert({ check_id: check.id, type: 'recovery', message, success: sent.success, messageId: sent.messageId });
  console.log(`[scheduler] ↑ RECOVERY "${check.name}" — whatsapp: ${sent.success}`);
}
```