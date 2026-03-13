import cron from 'node-cron';
import db from './db/schema';

// Health Checker / Reminder Runner
const runReminders = async () => {
  const ALERT_URL = process.env.ALERT_WEBHOOK_URL;
  if (!ALERT_URL) return;

  const now = new Date().toISOString();
  
  // Find bookings scheduled in exactly 24h
  const upcoming: any[] = db.prepare(`
    SELECT * FROM bookings 
    WHERE scheduled_at BETWEEN datetime(?, '+23 hours') AND datetime(?, '+25 hours')
    AND status = 'confirmed'
  `).all(now, now);

  for (const booking of upcoming) {
    try {
      // Trigger Evolution API or Webhook
      await fetch(ALERT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'WHATSAPP_REMINDER',
          phone: booking.lead_phone,
          message: `Hey ${booking.lead_name}, don't forget your value call in 24h! Watch this: https://indoctrination.page/${booking.funnel_id}`
        })
      });
      console.log(`Reminder sent to ${booking.lead_phone}`);
    } catch (err) {
      console.error('Failed to send reminder', err);
    }
  }
};

const scheduler = {
  start: () => {
    // Run every hour
    cron.schedule('0 * * * *', runReminders);
    console.log('Scheduler initialized: Running reminders hourly.');
  }
};

export default scheduler;