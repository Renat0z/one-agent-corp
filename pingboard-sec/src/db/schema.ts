import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = process.env.DB_PATH || join(process.cwd(), 'data/checks.db');

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS checks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      interval_seconds INTEGER DEFAULT 60,
      status TEXT DEFAULT 'unknown',
      last_checked_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      check_id TEXT NOT NULL,
      type TEXT NOT NULL,
      message TEXT,
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (check_id) REFERENCES checks (id)
    );
  `);
}
