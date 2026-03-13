import { db } from './schema.js';

export const db_ops = {
  getMappingBySku: (sku: string) => {
    return db.prepare('SELECT * FROM mappings WHERE sku = ?').get(sku) as any;
  },
  getMappings: () => {
    return db.prepare('SELECT * FROM mappings').all();
  },
  updateStatus: (sku: string, status: string) => {
    db.prepare('UPDATE mappings SET status = ?, last_sync = CURRENT_TIMESTAMP WHERE sku = ?').run(status, sku);
  },
  logSaving: (sku: string, amount: number) => {
    db.prepare('INSERT INTO savings_ledger (sku, amount) VALUES (?, ?)').run(sku, amount);
  }
};

export { db_ops as db };