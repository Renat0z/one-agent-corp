import { db } from '../db/queries.js';

export class LedgerService {
  static async recordPotentialSaving(productId: string, sku: string) {
    const avgCpc = 1.50; // Injected via config or mapping
    const dailyClicks = 50; 
    const savedAmount = avgCpc * dailyClicks;
    
    db.logSaving(sku, savedAmount);
    console.log(`[Ledger] SKU ${sku} OOS. Estimated daily saving: $${savedAmount}`);
  }
}