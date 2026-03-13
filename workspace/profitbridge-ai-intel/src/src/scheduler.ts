import cron from 'node-cron';
import { runManualCheck } from './services/checker.js';

export function startScheduler() {
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    console.log('[Cron] Starting health check sequence...');
    await runManualCheck();
    console.log('[Cron] Health check sequence completed.');
  });
}