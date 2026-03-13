import Database from 'better-sqlite3';
import path from 'path';

const dbPath = process.env.DB_PATH || 'profitbridge.db';
export const db = new Database(dbPath);

export function initializeDatabase() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS spreads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            asset TEXT,
            poolA TEXT,
            poolB TEXT,
            spread REAL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS trades (
            id TEXT PRIMARY KEY,
            asset TEXT,
            amount REAL,
            profit REAL,
            status TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);
    console.log('[DB] SQLite Schema initialized.');
}