import Database from 'better-sqlite3';
import { resolve } from 'path';

const dbPath = process.env.DB_PATH || resolve(__dirname, '../../data/checks.db');
const db = new Database(dbPath);

export const initSchema = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      api_key TEXT UNIQUE NOT NULL,
      api_secret_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS spreads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pair TEXT NOT NULL,
      spread_pct REAL NOT NULL,
      liquidity_pool TEXT NOT NULL,
      detected_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS trades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pair TEXT NOT NULL,
      amount REAL NOT NULL,
      side TEXT CHECK(side IN ('BUY', 'SELL')),
      status TEXT DEFAULT 'PENDING',
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

export default db;
