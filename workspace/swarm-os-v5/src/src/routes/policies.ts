import { Router } from 'express';
import { sqlite } from '../db/schema.js';

const router = Router();

router.get('/', (req, res) => {
    const policies = sqlite.prepare('SELECT * FROM policies').all();
    res.json(policies);
});

router.post('/', (req, res) => {
    const { name, rego_content } = req.body;
    const stmt = sqlite.prepare('INSERT INTO policies (name, rego_content) VALUES (?, ?)');
    const result = stmt.run(name, rego_content);
    res.json({ id: result.lastInsertRowid });
});

export const policyRoutes = router;