import { Router } from 'express';
import { InventoryService } from '../services/inventory.js';
import { LedgerService } from '../services/ledger.js';

export const router = Router();

router.post('/shopify/inventory-update', async (req, res) => {
  const { sku, available, product_id } = req.body;
  
  try {
    const result = await InventoryService.processUpdate(sku, available);
    if (available === 0) {
      await LedgerService.recordPotentialSaving(product_id, sku);
    }
    res.status(200).json({ success: true, action: result.action });
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).json({ error: 'Internal processing error' });
  }
});