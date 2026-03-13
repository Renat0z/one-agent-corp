import cron from 'node-cron';
import { db } from './db/schema.js';
import { runCheckById } from './services/checker.js';

const activeJobs = new Map<number, cron.ScheduledTask>();

export function syncScheduler() {
    console.log('[Scheduler] Syncing jobs...');
    
    // Stop existing
    activeJobs.forEach(job => job.stop());
    activeJobs.clear();

    const checks = db.prepare('SELECT id, interval_seconds FROM checks').all() as any[];

    checks.forEach(check => {
        // Convert seconds to cron format (simple approach for MVP: every X seconds/minutes)
        // For production, a more robust scheduling logic is needed
        const intervalMin = Math.max(1, Math.floor(check.interval_seconds / 60));
        const job = cron.schedule(`*/${intervalMin} * * * *`, () => {
            runCheckById(check.id);
        });
        activeJobs.set(check.id, job);
    });
}

// Resync every 10 minutes to pick up DB changes without complex hooks
cron.schedule('*/10 * * * *', () => syncScheduler());