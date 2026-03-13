/**
 * MetaConnector - Responsável pela comunicação com a Meta Ads API (Facebook/Instagram).
 * Implementa a estratégia de "Soft-Cap" para preservar a Fase de Aprendizado.
 */

export interface AdSetUpdate {
  adSetId: string;
  dailyBudget?: number;
  status?: 'ACTIVE' | 'PAUSED';
}

export class MetaConnector {
  private accessToken: string;
  private apiVersion = 'v18.0';
  private baseUrl = `https://graph.facebook.com/${this.apiVersion}`;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  /**
   * Executa a estratégia de Soft-Cap:
   * Em vez de pausar, reduz o orçamento para o mínimo (ex: R$ 5,00 ou 10% do original)
   * para manter o algoritmo "quente".
   */
  async applySoftCap(adSetId: string, currentBudget: number): Promise<boolean> {
    const miniBudget = Math.max(500, Math.floor(currentBudget * 0.1)); // 10% ou R$ 5,00 (em centavos se for a API)
    
    console.log(`[MetaAds] Aplicando Soft-Cap no AdSet ${adSetId}. Novo orçamento: ${miniBudget}`);
    
    // Simulação de chamada API
    // await axios.post(`${this.baseUrl}/${adSetId}`, { daily_budget: miniBudget, access_token: this.accessToken });
    
    return true;
  }

  /**
   * Restaura o orçamento original quando o estoque é reposto.
   */
  async restoreBudget(adSetId: string, originalBudget: number): Promise<boolean> {
    console.log(`[MetaAds] Restaurando orçamento original no AdSet ${adSetId}: ${originalBudget}`);
    return true;
  }

  /**
   * Pausa total (Último recurso se o estoque for zero absoluto por muito tempo).
   */
  async pauseAdSet(adSetId: string): Promise<boolean> {
    console.log(`[MetaAds] Pausando AdSet ${adSetId} (Estoque Zero)`);
    return true;
  }
}
