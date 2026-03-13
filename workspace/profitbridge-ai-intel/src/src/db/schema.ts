import Database from 'better-sqlite3';
import path from 'path';

const dbPath = process.env.DB_PATH || 'profitbridge.db';
export const db = new Database(dbPath);

// Enable WAL for concurrency
db.pragma('journal_mode = WAL');

export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS monitor_targets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      target_id INTEGER,
      status TEXT,
      response_time INTEGER,
      error_msg TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(target_id) REFERENCES monitor_targets(id)
    );
  `);

  // Seed default target if empty for MVP demo
  const count = db.prepare('SELECT count(*) as count FROM monitor_targets').get() as any;
  if (count.count === 0) {
    db.prepare('INSERT INTO monitor_targets (name, url) VALUES (?, ?)').run('ProfitBridge API', 'https://api.profitbridge.ai/health');
  }
}