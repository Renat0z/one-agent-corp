import cron from 'node-cron';
import { Queries } from './db/queries.js';
import { GoogleAdsClient } from './services/alerter.js';

export class Scheduler {
  static start() {
    // Run every hour
    cron.schedule('0 * * * *', async () => {
      console.log('[Scheduler] Running SKU health audit...');
      const skus = Queries.getAllSkus() as any[];
      
      for (const sku of skus) {
        const shouldBePaused = sku.stock <= 0 || sku.margin < 0.05;
        const currentStatus = sku.status;
        
        if (shouldBePaused && currentStatus === 'active') {
          await GoogleAdsClient.updateAdStatus(sku.shopify_id, 'paused');
          // Update local status logic here
        } else if (!shouldBePaused && currentStatus === 'paused') {
          await GoogleAdsClient.updateAdStatus(sku.shopify_id, 'active');
        }
      }
    });
  }
}