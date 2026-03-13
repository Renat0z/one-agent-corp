import express, { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import db from '../db/schema';
import { z } from 'zod';

const router = express.Router();

const FunnelSchema = z.object({
  name: z.string(),
  min_budget: z.number().optional(),
  video_url: z.string().url().optional(),
  deposit_required: z.boolean().optional(),
  deposit_amount: z.number().optional()
});

// Create Funnel (Qualification Workflow)
router.post('/funnels', (req: Request, res: Response) => {
  try {
    const data = FunnelSchema.parse(req.body);
    const id = randomUUID();
    
    const stmt = db.prepare(`
      INSERT INTO funnels (id, name, min_budget, video_url, deposit_required, deposit_amount)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(id, data.name, data.min_budget || 0, data.video_url || null, 
             data.deposit_required ? 1 : 0, data.deposit_amount || 0);
    
    res.status(201).json({ id, ...data });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Get Funnel Configuration
router.get('/funnels/:id', (req: Request, res: Response) => {
  const stmt = db.prepare('SELECT * FROM funnels WHERE id = ?');
  const funnel = stmt.get(req.params.id);
  
  if (!funnel) return res.status(404).json({ error: 'Not found' });
  res.json(funnel);
});

// Booking Initialization (Qualification Process)
router.post('/bookings', (req: Request, res: Response) => {
  const { funnel_id, lead_name, lead_phone, budget } = req.body;
  
  const funnel: any = db.prepare('SELECT * FROM funnels WHERE id = ?').get(funnel_id);
  if (!funnel) return res.status(404).json({ error: 'Funnel not found' });

  // Basic Qualification Logic
  const status = budget >= funnel.min_budget ? 'qualified' : 'disqualified';
  const id = randomUUID();

  db.prepare(`
    INSERT INTO bookings (id, funnel_id, lead_name, lead_phone, status)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, funnel_id, lead_name, lead_phone, status);

  res.json({ id, status, next_step: status === 'qualified' ? 'indoctrination' : 'none' });
});

export default router;