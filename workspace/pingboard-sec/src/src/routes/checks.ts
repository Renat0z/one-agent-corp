import { Router, Request, Response } from 'express';
import { db } from '../db/schema.js';
import { runCheckById } from '../services/checker.js';
import crypto from 'crypto';

const router = Router();

// Simple API Key Auth Middleware
const auth = (req: Request, res: Response, next: Function) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) return res.status(401).json({ error: 'Missing API Key' });
    
    const hashed = crypto.createHash('sha256').update(apiKey as string).digest('hex');
    const user = db.prepare('SELECT id FROM users WHERE api_key_hash = ?').get(hashed);
    
    if (!user) return res.status(403).json({ error: 'Invalid API Key' });
    (req as any).user_id = (user as any).id;
    next();
};

router.post('/', auth, (req, res) => {
    const { url, name, interval_seconds, whatsapp_recipient } = req.body;
    const userId = (req as any).user_id;

    const info = db.prepare(`
        INSERT INTO checks (url, name, interval_seconds, whatsapp_recipient, user_id)
        VALUES (?, ?, ?, ?, ?)
    `).run(url, name, interval_seconds || 60, whatsapp_recipient, userId);

    res.status(201).json({ id: info.lastInsertRowid, status: 'created' });
});

router.get('/', auth, (req, res) => {
    const userId = (req as any).user_id;
    const checks = db.prepare('SELECT * FROM checks WHERE user_id = ?').all(userId);
    res.json(checks);
});

router.delete('/:id', auth, (req, res) => {
    const userId = (req as any).user_id;
    db.prepare('DELETE FROM checks WHERE id = ? AND user_id = ?').run(req.params.id, userId);
    res.status(204).send();
});

router.post('/:id/run', auth, async (req, res) => {
    const userId = (req as any).user_id;
    const check = db.prepare('SELECT * FROM checks WHERE id = ? AND user_id = ?').get(req.params.id) as any;
    
    if (!check) return res.status(404).json({ error: 'Not found' });
    
    const result = await runCheckById(check.id);
    res.json(result);
});

export default router;