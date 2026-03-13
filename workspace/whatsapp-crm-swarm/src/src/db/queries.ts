import { db } from './schema.js';

export const Queries = {
  upsertLead: (lead: any) => {
    return db.prepare(`
      INSERT INTO leads (id, whatsapp_id, name, stage_id, source)
      VALUES (@id, @whatsapp_id, @name, @stage_id, @source)
      ON CONFLICT(whatsapp_id) DO UPDATE SET
      last_interaction_at = CURRENT_TIMESTAMP
    `).run(lead);
  },

  updateLeadStage: (id: string, stageId: string) => {
    return db.prepare('UPDATE leads SET stage_id = ?, last_interaction_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(stageId, id);
  },

  getLeadById: (id: string) => {
    return db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
  },

  getRulesByStage: (stageId: string) => {
    return db.prepare('SELECT * FROM swarm_rules WHERE stage_id = ?').all(stageId);
  },

  getAllLeads: () => {
    return db.prepare('SELECT * FROM leads ORDER BY last_interaction_at DESC').all();
  }
};