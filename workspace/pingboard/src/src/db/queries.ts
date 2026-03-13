```typescript
import { randomUUID, createHash } from 'node:crypto';

function hashOtp(otp: string): string {
  return createHash('sha256').update(otp).digest('hex');
}

import { getDb } from './schema.js';
import type { User, Check, CheckResult, Alert, CheckStatus } from '../types/index.js';

// ─── Users ───────────────────────────────────────────────────────────────────

export function getUserById(id: string): User | null {
  return getDb().prepare('SELECT * FROM users WHERE id = ?').get(id) as User | null;
}

export function getUserByApiKey(apiKey: string): User | null {
  return getDb().prepare('SELECT * FROM users WHERE api_key = ?').get(apiKey) as User | null;
}

export function getUserByWhatsapp(number: string): User | null {
  return getDb()
    .prepare('SELECT * FROM users WHERE whatsapp_number = ?')
    .get(number) as User | null;
}

export function createUser(data: Omit<User, 'created_at' | 'otp_attempts'>): User {
  getDb()
    .prepare(
      `INSERT INTO users (id, whatsapp_number, plan, checks_limit, api_key, otp_attempts)
       VALUES (?, ?, ?, ?, ?, 0)`,
    )
    .run(data.id, data.whatsapp_number, data.plan, data.checks_limit, data.api_key);
  return getUserById(data.id)!;
}

export function setUserOtp(userId: string, otp: string, expiresAt: number): void {
  const hash = hashOtp(otp);
  getDb()
    .prepare('UPDATE users SET otp_code = ?, otp_expires_at = ?, otp_attempts = 0 WHERE id = ?')
    .run(hash, expiresAt, userId);
}

export function incrementOtpAttempts(userId: string): number {
  const user = getUserById(userId);
  if (!user) return 0;
  const newCount = user.otp_attempts + 1;
  getDb()
    .prepare('UPDATE users SET otp_attempts = ? WHERE id = ?')
    .run(newCount, userId);
  return newCount;
}

export function clearUserOtp(userId: string): void {
  getDb()
    .prepare('UPDATE users SET otp_code = NULL, otp_expires_at = NULL, otp_attempts = 0 WHERE id = ?')
    .run(userId);
}

// ─── Checks ──────────────────────────────────────────────────────────────────

export function getChecks(userId: string): Check[] {
  return getDb()
    .prepare('SELECT * FROM checks WHERE user_id = ? ORDER BY created_at DESC')
    .all(userId) as Check[];
}

export function getCheckById(id: string): Check | null {
  return getDb().prepare('SELECT * FROM checks WHERE id = ?').get(id) as Check | null;
}

export function getAllActiveChecks(): Check[] {
  return getDb().prepare('SELECT * FROM checks').all() as Check[];
}

export function getCheckCount(userId: string): number {
  const row = getDb()
    .prepare('SELECT COUNT(*) AS n FROM checks WHERE user_id = ?')
    .get(userId) as { n: number };
  return row.n;
}

export function createCheck(data: Check): Check {
  getDb()
    .prepare(
      `INSERT INTO checks
         (id, user_id, url, name, interval_seconds, timeout_ms,
          status, consecutive_failures, last_checked_at, last_status_change_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      data.id, data.user_id, data.url, data.name,
      data.interval_seconds, data.timeout_ms, data.status,
      data.consecutive_failures, data.last_checked_at,
      data.last_status_change_at, data.created_at,
    );
  return getCheckById(data.id)!;
}

export function updateCheck(
  id:   string,
  data: Partial<Pick<Check, 'name' | 'interval_seconds' | 'timeout_ms'>>,
): Check {
  const sets: string[]  = [];
  const vals: unknown[] = [];

  if (data.name             !== undefined) { sets.push('name = ?');             vals.push(data.name); }
  if (data.interval_seconds !== undefined) { sets.push('interval_seconds = ?'); vals.push(data.interval_seconds); }
  if (data.timeout_ms       !== undefined) { sets.push('timeout_ms = ?');       vals.push(data.timeout_ms); }

  if (sets.length === 0) return getCheckById(id)!;

  vals.push(id);
  getDb().prepare(`UPDATE checks SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
  return getCheckById(id)!;
}

export function deleteCheck(id: string): void {
  getDb().prepare('DELETE FROM checks WHERE id = ?').run(id);
}

export function updateCheckStatus(
  id:             string,
  status:         CheckStatus,
  consecutive:    number,
  statusChanged:  boolean,
): void {
  const now = Math.floor(Date.now() / 1000);

  if (statusChanged) {
    getDb()
      .prepare(
        `UPDATE checks
         SET status = ?, consecutive_failures = ?,
             last_checked_at = ?, last_status_change_at = ?
         WHERE id = ?`,
      )
      .run(status, consecutive, now, now, id);
  } else {
    getDb()
      .prepare(
        `UPDATE checks
         SET status = ?, consecutive_failures = ?, last_checked_at = ?
         WHERE id = ?`,
      )
      .run(status, consecutive, now, id);
  }
}

// ─── Check Results ────────────────────────────────────────────────────────────

export function saveCheckResult(data: {
  check_id:         string;
  is_up:            boolean;
  status_code:      number | null;
  response_time_ms: number;
  error:            string | null;
}): void {
  getDb()
    .prepare(
      `INSERT INTO check_results (id, check_id, is_up, status_code, response_time_ms, error)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      randomUUID(), data.check_id, data.is_up ? 1 : 0,
      data.status_code, data.response_time_ms, data.error,
    );
}

export function getCheckResults(checkId: string, limit = 50): CheckResult[] {
  return getDb()
    .prepare(
      `SELECT * FROM check_results
       WHERE check_id = ? ORDER BY checked_at DESC LIMIT ?`,
    )
    .all(checkId, limit) as CheckResult[];
}

export function purgeOldResults(days = 30): number {
  const cutoff = Math.floor(Date.now() / 1000) - days * 86_400;
  return getDb().prepare('DELETE FROM check_results WHERE checked_at < ?').run(cutoff).changes;
}

// ─── Alerts ───────────────────────────────────────────────────────────────────

export function saveAlert(data: {
  check_id:  string;
  type:      'down' | 'recovery';
  message:   string;
  success:   boolean;
  messageId: string | null;
}): void {
  const now = Math.floor(Date.now() / 1000);
  getDb()
    .prepare(
      `INSERT INTO alerts (id, check_id, type, message, sent_at, whatsapp_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      randomUUID(), data.check_id, data.type, data.message,
      data.success ? now : null, data.messageId, now,
    );
}

export function getAlerts(checkId: string, limit = 20): Alert[] {
  return getDb()
    .prepare(
      `SELECT * FROM alerts WHERE check_id = ? ORDER BY created_at DESC LIMIT ?`,
    )
    .all(checkId, limit) as Alert[];
}
```