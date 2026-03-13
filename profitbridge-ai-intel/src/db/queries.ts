import { db } from './schema';

export interface Check {
  id: number;
  name: string;
  url: string;
  expected_status: number;
  last_check_status?: number;
  last_check_at?: string;
  is_active: boolean;
  alert_webhook_url?: string;
}

export const queries = {
  getAllChecks: () => db.prepare('SELECT * FROM checks WHERE is_active = 1').all() as Check[],
  
  createCheck: (check: Partial<Check>) => {
    const stmt = db.prepare(`
      INSERT INTO checks (name, url, expected_status, alert_webhook_url)
      VALUES (?, ?, ?, ?)
    `);
    return stmt.run(check.name, check.url, check.expected_status || 200, check.alert_webhook_url);
  },

  updateCheckResult: (id: number, status: number, timestamp: string) => {
    db.prepare('UPDATE checks SET last_check_status = ?, last_check_at = ? WHERE id = ?')
      .run(status, timestamp, id);
  },

  logCheck: (checkId: number, status: number, responseTime: number, success: boolean) => {
    db.prepare(`
      INSERT INTO audit_logs (check_id, status_code, response_time_ms, success)
      VALUES (?, ?, ?, ?)
    `).run(checkId, status, responseTime, success ? 1 : 0);
  }
};
