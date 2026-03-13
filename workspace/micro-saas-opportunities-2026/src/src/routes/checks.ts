import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/schema.js';
import { Alerter } from '../services/alerter.js';

export const checkRouter = Router();

const BookingSchema = z.object({
  lead_name: z.string(),
  lead_phone: z.string(),
  appointment_time: z.string().datetime(),
  deposit_paid: z.boolean().default(false),
});

checkRouter.post('/booking', async (req, res) => {
  try {
    const data = BookingSchema.parse(req.body);
    
    const stmt = db.prepare(`
      INSERT INTO bookings (lead_name, lead_phone, appointment_time, deposit_paid, status)
      VALUES (?, ?, ?, ?, 'pending')
    `);
    
    const info = stmt.run(data.lead_name, data.lead_phone, data.appointment_time, data.deposit_paid ? 1 : 0);
    
    // Immediate confirmation alert
    await Alerter.sendWhatsApp(data.lead_phone, `Hi ${data.lead_name}, your high-ticket strategy session is confirmed for ${data.appointment_time}. Please ensure you've completed your homework.`);

    res.status(201).json({ id: info.lastInsertRowid, ...data });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

checkRouter.get('/stats', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as count FROM bookings').get() as { count: number };
  const confirmed = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'confirmed'").get() as { count: number };
  res.json({ total: total.count, confirmed: confirmed.count });
});