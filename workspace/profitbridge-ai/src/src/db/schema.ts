import Database from 'better-sqlite3';
const db = new Database('profitbridge.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS mappings (
    sku TEXT PRIMARY KEY,
    adGroupId TEXT NOT NULL,
    status TEXT DEFAULT 'enabled',
    last_sync DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS savings_ledger (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku TEXT,
    amount REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

export { db };