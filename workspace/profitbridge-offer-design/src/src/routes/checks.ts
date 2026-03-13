import { Router } from 'express';
import { getLatestSpreads, logTrade } from '../db/queries';
import { executeArbitrage } from '../services/checker';

export const router = Router();

router.get('/bridge/spreads', (req, res) => {
    const spreads = getLatestSpreads();
    res.json(spreads);
});

router.post('/trades/execute', async (req, res) => {
    const { poolA, poolB, asset, amount } = req.body;
    
    if (!poolA || !poolB || !asset || !amount) {
        return res.status(400).json({ error: 'Missing execution parameters' });
    }

    try {
        const result = await executeArbitrage(poolA, poolB, asset, amount);
        logTrade(result);
        res.json({ success: true, trade: result });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});