import { EvolutionService } from './checker.js';

export const SwarmAutoResponder = async (leadName: string, leadPhone: string) => {
  const evolution = new EvolutionService();
  const message = `Olá ${leadName}! Recebemos seu interesse. Em instantes um consultor falará com você.`;
  
  // Async fire-and-forget for MVP
  evolution.sendMessage('main_instance', leadPhone, message);
};