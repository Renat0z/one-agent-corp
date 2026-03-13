import cron from 'node-cron';
import { discoverSpreads } from './services/checker';
import { saveSpread } from './db/queries';
import { notifySpread } from './services/alerter';

export function startScheduler() {
    console.log('[Scheduler] Arbitrage scan active (1m interval)');
    
    cron.schedule('* * * * *', async () => {
        try {
            const results = await discoverSpreads();
            results.forEach(result => {
                saveSpread(result);
                notifySpread(result.asset, result.spread);
            });
            console.log(`[Scheduler] Scan complete: ${results.length} pairs checked.`);
        } catch (error) {
            console.error('[Scheduler] Error during scan:', error);
        }
    });
}