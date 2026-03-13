import { readFile } from 'fs/promises';
import path from 'path';

/**
 * MINDSET MANAGER ENGINE
 * Garante que a LLM entre no estado mental correto antes de cada tarefa.
 */
export class MindsetManager {
  /**
   * CONSELHO DAS MENTES: Seleciona especialistas baseado no domínio.
   */
  static getExperts(domain: 'business' | 'product' | 'marketing' | 'tech'): string[] {
    const council: Record<string, string[]> = {
      business: ['michael_porter', 'eliyahu_goldratt', 'ray_dalio'],
      product: ['eric_ries', 'marty_cagan', 'clayton_christensen'],
      marketing: ['alex_hormozi', 'seth_godin', 'al_ries'],
      tech: ['martin_fowler', 'robert_c_martin', 'werner_vogels']
    };
    return council[domain] || [];
  }

  static async getContext(mindsetId: 'architect' | 'hormozi' | 'topologist'): Promise<string> {
    // ... lógica anterior ...
    return ""; // Placeholder para brevidade na edição
  }
}
