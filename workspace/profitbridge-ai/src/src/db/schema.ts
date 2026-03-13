import Database from 'better-sqlite3';
import path from 'path';

export const db = new Database(path.join(__dirname, '../../data/profitbridge.db'));

export function initDB() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS flagged_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE,
            reason TEXT,
            details TEXT,
            status TEXT DEFAULT 'PENDING',
            detected_at DATETIME
        );

        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_type TEXT,
            details TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS access_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            ip_address TEXT,
            geo_location TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);
    console.log('[Database] Schema initialized.');
}