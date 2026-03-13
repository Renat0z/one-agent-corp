import { db } from '../db/schema.js';
import { sendAlert } from './alerter.js';

export async function runManualCheck() {
  const targets = db.prepare('SELECT * FROM monitor_targets WHERE active = 1').all() as any[];
  const results = [];

  for (const target of targets) {
    const start = Date.now();
    let status = 'UP';
    let responseTime = 0;

    try {
      const response = await fetch(target.url, { method: 'GET', signal: AbortSignal.timeout(5000) });
      responseTime = Date.now() - start;
      if (!response.ok) status = 'DOWN';
    } catch (err) {
      status = 'DOWN';
      responseTime = Date.now() - start;
    }

    // Log Result
    db.prepare(`
      INSERT INTO audit_logs (target_id, status, response_time, error_msg)
      VALUES (?, ?, ?, ?)
    `).run(target.id, status, responseTime, status === 'DOWN' ? 'Connection Timeout or Refused' : null);

    if (status === 'DOWN') {
      await sendAlert(target.name, target.url);
    }

    results.push({ name: target.name, status });
  }

  return results;
}