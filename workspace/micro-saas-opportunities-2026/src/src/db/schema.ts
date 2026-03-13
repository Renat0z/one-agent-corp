import Database from 'better-sqlite3';
import path from 'path';

const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'data', 'hormozihook.db');
export const db = new Database(dbPath);

export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_name TEXT NOT NULL,
      lead_phone TEXT NOT NULL,
      appointment_time DATETIME NOT NULL,
      deposit_paid INTEGER DEFAULT 0,
      reminder_sent INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('Database initialized at', dbPath);
}