import cron from 'node-cron';
import { GoogleAdsService } from './services/google-ads.js';

export const scheduler = {
  start: () => {
    // Run full sync every hour
    cron.schedule('0 * * * *', () => {
      console.log('[Scheduler] Starting hourly sync...');
      GoogleAdsService.syncAll();
    });
  }
};