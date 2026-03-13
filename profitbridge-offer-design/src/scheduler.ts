import cron from 'node-cron';
import { SpreadChecker } from './services/checker';

export const startScheduler = () => {
    // Run spread check every 1 minute
    cron.schedule('*/1 * * * *', async () => {
        try {
            await SpreadChecker.findSpreads();
        } catch (error) {
            console.error('[Scheduler] Error in spread checker job:', error);
        }
    });

    console.log('[Scheduler] Spread Checker Job Initialized (1-minute intervals)');
};
