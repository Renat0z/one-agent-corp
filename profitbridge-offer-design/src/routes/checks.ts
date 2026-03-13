import { Router } from 'express';
import { Queries } from '../db/queries';

const router = Router();

// Stream live arbitrage opportunities
router.get('/spreads', (req, res) => {
    try {
        const spreads = Queries.getTopSpreads(10);
        res.status(200).json(spreads);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch spreads' });
    }
});

// Manually trigger a trade (One-Click)
router.post('/trades/execute', (req, res) => {
    const { pair, amount, side } = req.body;
    
    if (!pair || !amount || !side) {
        return res.status(400).json({ error: 'Missing pair, amount, or side' });
    }

    try {
        Queries.recordTrade(pair, parseFloat(amount), side as 'BUY' | 'SELL');
        res.status(201).json({ message: 'Trade executed successfully', pair, amount, side });
    } catch (error) {
        res.status(500).json({ error: 'Trade execution failed' });
    }
});

// Link exchange/wallet (Placeholder for MVP)
router.post('/connect', (req, res) => {
    const { api_key, api_secret } = req.body;
    if (!api_key || !api_secret) {
        return res.status(400).json({ error: 'Missing credentials' });
    }
    res.status(200).json({ message: 'Exchange connected successfully', api_key });
});

export default router;
