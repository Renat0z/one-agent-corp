import { db } from './schema.js';

export const Queries = {
  getLatestLogs: (limit = 10) => {
    return db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?').all(limit);
  },
  getTargets: () => {
    return db.prepare('SELECT * FROM monitor_targets WHERE active = 1').all();
  }
};