import cron from 'node-cron';
import { SyncEngine } from './services/sync-engine';

// Run every day at 03:00 AM
cron.schedule('0 3 * * *', async () => {
    console.log('[Scheduler] Running automated daily sync...');
    try {
        await SyncEngine.performFullSync();
        console.log('[Scheduler] Daily sync finished successfully.');
    } catch (err) {
        console.error('[Scheduler] Error during daily sync:', err);
    }
});