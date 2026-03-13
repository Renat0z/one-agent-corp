import Database from 'better-sqlite3';
import path from 'path';

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/checks.db');
const db = new Database(dbPath);

// Schema Initialization
db.exec(`
  CREATE TABLE IF NOT EXISTS funnels (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    min_budget INTEGER DEFAULT 0,
    video_url TEXT,
    deposit_required BOOLEAN DEFAULT 0,
    deposit_amount INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    funnel_id TEXT,
    lead_name TEXT,
    lead_phone TEXT,
    status TEXT DEFAULT 'pending', -- pending, qualified, indoctrinated, deposit_paid, confirmed
    scheduled_at DATETIME,
    FOREIGN KEY(funnel_id) REFERENCES funnels(id)
  );
`);

export default db;