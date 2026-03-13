import { Router } from 'express';
import { GoogleAdsService } from '../services/google-ads.js';
import { db } from '../db/queries.js';

export const router = Router();

router.get('/status', (req, res) => {
  const activeMappings = db.getMappings();
  res.json(activeMappings);
});

router.post('/sync-now', async (req, res) => {
  try {
    await GoogleAdsService.syncAll();
    res.json({ message: 'Manual sync triggered' });
  } catch (error) {
    res.status(500).json({ error: 'Sync failed' });
  }
});