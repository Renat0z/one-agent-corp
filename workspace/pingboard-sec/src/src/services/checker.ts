import { db } from '../db/schema.js';
import { sendAlert } from './alerter.js';

export async function runCheckById(id: number | string) {
    const check = db.prepare('SELECT * FROM checks WHERE id = ?').get(id) as any;
    if (!check) return;

    const start = Date.now();
    let currentStatus: 'up' | 'down' = 'up';
    let statusCode = 200;

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), parseInt(process.env.CHECK_TIMEOUT_MS || '10000'));
        
        const response = await fetch(check.url, { 
            method: 'HEAD', 
            signal: controller.signal,
            headers: { 'User-Agent': 'Pingboard-Sec/1.0' }
        });
        
        clearTimeout(timeout);
        statusCode = response.status;
        if (!response.ok) currentStatus = 'down';
    } catch (error) {
        currentStatus = 'down';
        statusCode = 0;
    }

    const latency = Date.now() - start;

    // Detect State Transition
    if (currentStatus !== check.status) {
        const alertType = currentStatus === 'down' ? 'down' : 'recovery';
        const message = alertType === 'down' 
            ? `🚨 ALERT: ${check.name} (${check.url}) is DOWN! Status: ${statusCode}`
            : `✅ RECOVERY: ${check.name} (${check.url}) is back UP.`;
        
        await sendAlert(check.whatsapp_recipient, message);
        
        db.prepare('INSERT INTO alerts (check_id, type, status_code, latency_ms, message) VALUES (?, ?, ?, ?, ?)')
          .run(check.id, alertType, statusCode, latency, message);
    }

    db.prepare(`
        UPDATE checks 
        SET status = ?, last_checked_at = CURRENT_TIMESTAMP 
        WHERE id = ?
    `).run(currentStatus, check.id);

    return { status: currentStatus, latency, statusCode };
}