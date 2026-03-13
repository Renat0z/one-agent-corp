import { db } from './schema';

export function getFlaggedUsers() {
    return db.prepare('SELECT * FROM flagged_users WHERE status = "PENDING"').all();
}

export function getAuditLogs() {
    return db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100').all();
}