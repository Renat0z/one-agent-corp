import { Router } from 'express';
import { SyncEngine } from '../services/sync-engine';
import { getAuditLogs, getFlaggedUsers } from '../db/queries';

export const router = Router();

router.post('/run-sync', async (req, res) => {
    try {
        const results = await SyncEngine.performFullSync();
        res.json({ message: 'Sync completed', results });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/flagged', (req, res) => {
    const users = getFlaggedUsers();
    res.json(users);
});

router.get('/logs', (req, res) => {
    const logs = getAuditLogs();
    res.json(logs);
});