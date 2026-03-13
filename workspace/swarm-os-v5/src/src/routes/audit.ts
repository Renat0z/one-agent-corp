import { Router } from 'express';
import { sqlite } from '../db/schema.js';

const router = Router();

router.get('/logs', (req, res) => {
    const logs = sqlite.prepare(`
        SELECT a.hash, a.status, v.intent_match_score, v.policy_verdict, a.created_at 
        FROM artifacts a 
        JOIN validation_results v ON a.id = v.artifact_id 
        ORDER BY a.created_at DESC LIMIT 100
    `).all();
    res.json(logs);
});

export const auditRoutes = router;