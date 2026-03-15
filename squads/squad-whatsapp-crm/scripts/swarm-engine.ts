import { Queries } from '../db/queries.js';
import { EvolutionService } from './evolution.js';

export const SwarmEngine = {
  executeStageRules: async (leadId: string, stageId: string) => {
    const lead: any = Queries.getLeadById(leadId);
    if (!lead) return;

    const rules: any[] = Queries.getRulesByStage(stageId);
    for (const rule of rules) {
      if (rule.trigger_type === 'on_enter') {
        if (rule.action_type === 'send_text') {
          await EvolutionService.sendMessage('default', lead.whatsapp_id, rule.content);
        }
      }
    }
  }
};