import Database from 'better-sqlite3';
import path from 'path';

const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'data', 'crm.db');

export const db: Database.Database = new Database(dbPath);
db.pragma('journal_mode = WAL');

export function initDB() {
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS stages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      color TEXT DEFAULT '#3b82f6'
    );

    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      whatsapp_id TEXT UNIQUE NOT NULL,
      name TEXT,
      stage_id TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      source TEXT,
      last_interaction_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (stage_id) REFERENCES stages(id)
    );

    CREATE TABLE IF NOT EXISTS swarm_rules (
      id TEXT PRIMARY KEY,
      stage_id TEXT NOT NULL,
      trigger_type TEXT NOT NULL,
      action_type TEXT NOT NULL,
      content TEXT NOT NULL,
      FOREIGN KEY (stage_id) REFERENCES stages(id)
    );
  `);

  // Seed initial stages
  try {
    const stageCount = db.prepare('SELECT COUNT(*) as count FROM stages').get() as { count: number };
    if (stageCount.count === 0) {
      db.prepare('INSERT INTO stages (id, name, sort_order) VALUES (?, ?, ?)').run('1', 'Novo Lead', 0);
      db.prepare('INSERT INTO stages (id, name, sort_order) VALUES (?, ?, ?)').run('2', 'Em Atendimento', 1);
      db.prepare('INSERT INTO stages (id, name, sort_order) VALUES (?, ?, ?)').run('3', 'Agendado', 2);
    }
  } catch (error) {
    console.error('Error seeding stages:', error);
  }
}