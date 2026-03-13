import { Router } from 'express';
import { Queries } from '../db/queries.js';
import { SwarmEngine } from '../services/swarm-engine.js';
import { v4 as uuid } from 'uuid';

const router = Router();

router.post('/webhook', async (req, res) => {
  const { event, data } = req.body;

  if (event === 'messages.upsert' && !data.key.fromMe) {
    const whatsappId = data.key.remoteJid;
    const name = data.pushName || 'Lead Web';
    
    const leadId = uuid();
    Queries.upsertLead({
      id: leadId,
      whatsapp_id: whatsappId,
      name: name,
      stage_id: '1', // Novo Lead
      source: 'whatsapp'
    });

    // Auto-reply Swarm Logic
    await SwarmEngine.executeStageRules(leadId, '1');
  }

  res.sendStatus(200);
});

export default router;