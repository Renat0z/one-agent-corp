import { Router } from 'express';
import { Queries } from '../db/queries.js';
import { MarginCalculator } from './../services/checker.js';

const router = Router();

router.get('/skus', (req, res) => {
  const skus = Queries.getAllSkus();
  res.json(skus);
});

router.post('/sync-shopify', async (req, res) => {
  // Webhook endpoint for Shopify product/update
  const { id, variants } = req.body;
  for (const variant of variants) {
    const margin = MarginCalculator.calculate(variant.price, variant.grams, 0); // Simplified
    Queries.upsertSku({
      shopify_id: variant.id.toString(),
      handle: variant.sku || id.toString(),
      price: parseFloat(variant.price),
      cogs: 0, // Should come from metafields in production
      stock: variant.inventory_quantity,
      margin: margin,
      status: margin > 0.05 && variant.inventory_quantity > 0 ? 'active' : 'paused'
    });
  }
  res.status(200).send('OK');
});

export { router };