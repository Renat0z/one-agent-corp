import { db } from './schema.js';

export const Queries = {
  getAllBookings: () => db.prepare('SELECT * FROM bookings ORDER BY appointment_time ASC').all(),
  updateStatus: (id: number, status: string) => 
    db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(status, id)
};