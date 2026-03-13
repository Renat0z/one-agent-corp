import { db } from '../db/schema.js';

export class Checker {
  static async getPendingReminders() {
    const now = new Date();
    const target = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(); // 24h from now

    return db.prepare(`
      SELECT * FROM bookings 
      WHERE appointment_time <= ? 
      AND status = 'pending' 
      AND reminder_sent = 0
    `).all(target) as any[];
  }

  static async markAsSent(id: number) {
    db.prepare('UPDATE bookings SET reminder_sent = 1 WHERE id = ?').run(id);
  }
}