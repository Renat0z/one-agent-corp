import { Router } from 'express';
import { db } from '../db/schema.js';
import { runManualCheck } from '../services/checker.js';

export const checkRouter = Router();

checkRouter.get('/history', (req, res) => {
  const logs = db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50').all();
  res.json(logs);
});

checkRouter.post('/trigger', async (req, res) => {
  try {
    const results = await runManualCheck();
    res.json({ message: 'Check completed', results });
  } catch (error) {
    res.status(500).json({ error: 'Manual check failed' });
  }
});