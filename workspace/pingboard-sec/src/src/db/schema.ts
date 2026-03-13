import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';

const dbPath = process.env.DB_PATH || './data/pingboard.db';
export const db = new Database(dbPath);

export function initializeDatabase() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            api_key_hash TEXT UNIQUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS checks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            url TEXT NOT NULL,
            name TEXT NOT NULL,
            interval_seconds INTEGER DEFAULT 60,
            status TEXT DEFAULT 'unknown',
            whatsapp_recipient TEXT,
            last_checked_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            check_id INTEGER,
            type TEXT,
            status_code INTEGER,
            latency_ms INTEGER,
            message TEXT,
            sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(check_id) REFERENCES checks(id)
        );
    `);

    // Create default user if MASTER_API_KEY is provided
    if (process.env.MASTER_API_KEY) {
        const hash = crypto.createHash('sha256').update(process.env.MASTER_API_KEY).digest('hex');
        db.prepare('INSERT OR IGNORE INTO users (api_key_hash) VALUES (?)').run(hash);
    }
}