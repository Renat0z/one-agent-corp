import { PlatformAPI } from './platform-api';
import { FingerprintService } from './fingerprint';
import { db } from '../db/schema';

export class SyncEngine {
    static async performFullSync() {
        console.log('[SyncEngine] Starting cross-reference audit...');
        
        const platformUsers = await PlatformAPI.getActiveStudents();
        const flaggedCount = 0;

        for (const user of platformUsers) {
            const paymentStatus = await PlatformAPI.getPaymentStatus(user.email);
            
            if (paymentStatus === 'CANCELED' || paymentStatus === 'REFUNDED') {
                this.flagUser(user.email, 'REVENUE_LEAK', 'Active access with canceled payment');
            }

            const isSharing = await FingerprintService.analyzeAccessPatterns(user.id);
            if (isSharing) {
                this.flagUser(user.email, 'ACCOUNT_SHARING', 'Multiple concurrent IP signatures detected');
            }
        }

        return { analyzed: platformUsers.length, flagged: flaggedCount };
    }

    private static flagUser(email: string, reason: string, details: string) {
        db.prepare(`
            INSERT OR REPLACE INTO flagged_users (email, reason, details, status, detected_at)
            VALUES (?, ?, ?, 'PENDING', CURRENT_TIMESTAMP)
        `).run(email, reason, details);
    }
}