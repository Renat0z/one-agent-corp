import sqlite from 'better-sqlite3';
import path from 'path';

export class Database {
  static db: sqlite.Database;

  static init() {
    this.db = new sqlite(path.join(process.cwd(), 'data', 'profitbridge.db'));
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS skus (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shopify_id TEXT UNIQUE,
        handle TEXT,
        price REAL,
        cogs REAL,
        shipping REAL,
        stock INTEGER,
        margin REAL,
        status TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);
  }
}