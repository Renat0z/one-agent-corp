import { GoogleAdsService } from './google-ads.js';
import { db } from '../db/queries.js';

export class InventoryService {
  static async processUpdate(sku: string, stock: number) {
    const mapping = db.getMappingBySku(sku);
    if (!mapping) return { action: 'none', reason: 'no_mapping' };

    if (stock <= 0) {
      await GoogleAdsService.pauseAdGroup(mapping.adGroupId);
      db.updateStatus(sku, 'paused');
      return { action: 'paused' };
    } else {
      await GoogleAdsService.enableAdGroup(mapping.adGroupId);
      db.updateStatus(sku, 'enabled');
      return { action: 'enabled' };
    }
  }
}