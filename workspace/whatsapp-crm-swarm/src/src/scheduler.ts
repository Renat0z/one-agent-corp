import cron from 'node-cron';
import { db } from './db/schema.js';

// Cleanup logs older than 7 days
cron.schedule('0 0 * * *', () => {
  console.log('Running daily maintenance...');
  try {
    db.prepare("DELETE FROM logs WHERE created_at < date('now', '-7 days')").run();
    console.log('Maintenance completed');
  } catch (error) {
    console.error('Maintenance error:', error);
  }
});