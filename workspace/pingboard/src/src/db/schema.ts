```typescript
import Database from 'better-sqlite3';
import { mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';

let _db: Database.Database | null = null;

export function initDb(dbPath: string): Database.Database {
  const dir = path.dirname(path.resolve(dbPath));
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  _db = new Database(dbPath);
  _db.pragma('journal_mode = WAL');    // concurrent reads without blocking writes
  _db.pragma('foreign_keys = ON');
  _db.pragma('synchronous = NORMAL'); // safe + fast (not fsync on every write)
  _db.pragma('cache_size = -32000'); // 32 MB page cache

  _applySchema(_db);
  return _db;
}

export function getDb(): Database.Database {
  if (!_db) throw new Error('[db] Not initialized — call initDb() in server bootstrap.');
  return _db;
}

function _applySchema(db: Database.Database): void {
  db.exec(`
    -- ── Users ──────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS users (
      id               TEXT PRIMARY KEY,
      whatsapp_number  TEXT UNIQUE NOT NULL,
      plan             TEXT NOT NULL DEFAULT 'free'
                            CHECK(plan IN ('free','starter','pro')),
      checks_limit     INTEGER NOT NULL DEFAULT 3,
      api_key          TEXT UNIQUE NOT NULL,
      otp_code         TEXT,
      otp_expires_at   INTEGER,
      otp_attempts     INTEGER NOT NULL DEFAULT 0,
      created_at       INTEGER NOT NULL DEFAULT (unixepoch())
    );

    -- ── Checks ──────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS checks (
      id                    TEXT PRIMARY KEY,
      user_id               TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      url                   TEXT NOT NULL,
      name                  TEXT NOT NULL,
      interval_seconds      INTEGER NOT NULL DEFAULT 60,
      timeout_ms            INTEGER NOT NULL DEFAULT 5000,
      status                TEXT NOT NULL DEFAULT 'unknown'
                                  CHECK(status IN ('up','down','unknown')),
      consecutive_failures  INTEGER NOT NULL DEFAULT 0,
      last_checked_at       INTEGER,
      last_status_change_at INTEGER,
      created_at            INTEGER NOT NULL DEFAULT (unixepoch())
    );

    -- ── Check Results ────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS check_results (
      id               TEXT PRIMARY KEY,
      check_id         TEXT NOT NULL REFERENCES checks(id) ON DELETE CASCADE,
      is_up            INTEGER NOT NULL CHECK(is_up IN (0,1)),
      status_code      INTEGER,
      response_time_ms INTEGER NOT NULL,
      error            TEXT,
      checked_at       INTEGER NOT NULL DEFAULT (unixepoch())
    );

    -- ── Alerts ──────────────────────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS alerts (
      id          TEXT PRIMARY KEY,
      check_id    TEXT NOT NULL REFERENCES checks(id) ON DELETE CASCADE,
      type        TEXT NOT NULL CHECK(type IN ('down','recovery')),
      message     TEXT NOT NULL,
      sent_at     INTEGER,
      whatsapp_id TEXT,
      created_at  INTEGER NOT NULL DEFAULT (unixepoch())
    );

    -- ── Indexes ─────────────────────────────────────────────────────────────
    CREATE INDEX IF NOT EXISTS idx_checks_user_id     ON checks(user_id);
    CREATE INDEX IF NOT EXISTS idx_results_check_time ON check_results(check_id, checked_at DESC);
    CREATE INDEX IF NOT EXISTS idx_alerts_check_time  ON alerts(check_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_users_api_key      ON users(api_key);
  `);
}
```