import { Router, Request, Response } from 'express';
import { Queries } from '../db/queries.js';

const router = Router();

router.post('/evolution/webhook', async (req: Request, res: Response) => {
  const { data, event } = req.body;

  if (event === 'messages.upsert') {
    const phone = data.key.remoteJid.split('@')[0];
    const name = data.pushName || 'Lead WhatsApp';

    Queries.upsertLead({
      id: data.key.id,
      whatsapp_id: phone,
      name: name,
      stage_id: '1',
      source: 'whatsapp'
    });
  }

  res.status(200).json({ status: 'received' });
});

router.get('/leads', (_req: Request, res: Response) => {
  const leads = Queries.getAllLeads();
  res.json(leads);
});

export default router;