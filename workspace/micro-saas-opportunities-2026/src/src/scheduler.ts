import cron from 'node-cron';
import { Checker } from './services/checker.js';
import { Alerter } from './services/alerter.js';

export function startScheduler() {
  // Check every hour for upcoming appointments
  cron.schedule('0 * * * *', async () => {
    console.log('Running reminder check...');
    const pending = await Checker.getPendingReminders();
    
    for (const booking of pending) {
      const msg = `Reminder: Your session is in less than 24h. Please confirm you've watched the training video.`;
      await Alerter.sendWhatsApp(booking.lead_phone, msg);
      await Checker.markAsSent(booking.id);
    }
  });
}