import { Router } from 'express';
import { db } from '../db/schema';

export const router = Router();

router.post('/hotmart', (req, res) => {
    const { event, data } = req.body;
    
    // Quick log of the event for auditing
    db.prepare('INSERT INTO audit_logs (event_type, details) VALUES (?, ?)')
      .run('HOTMART_WEBHOOK', JSON.stringify({ event, email: data?.buyer?.email }));

    // In a real scenario, we'd trigger a specific sync for this user
    res.status(200).send('OK');
});