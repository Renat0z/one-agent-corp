import { BlingConnector } from './connectors/BlingConnector';
import { MetaConnector } from './connectors/MetaConnector';

/**
 * ProfitBridge Engine - O Cérebro do Sistema.
 * Orquestra a leitura do ERP e a ação nas plataformas de Ads.
 */

class ProfitBridgeEngine {
  private bling: BlingConnector;
  private meta: MetaConnector;

  constructor(blingKey: string, metaToken: string) {
    this.bling = new BlingConnector(blingKey);
    this.meta = new MetaConnector(metaToken);
  }

  /**
   * Ciclo de Sincronização para um mapeamento Produto <-> AdSet
   */
  async syncProductToAd(sku: string, adSetId: string, originalBudget: number) {
    console.log(`\n--- Iniciando Sync: SKU ${sku} ---`);
    
    // 1. Busca estoque real no ERP
    const stock = await this.bling.getStock(sku);
    console.log(`Estoque atual: ${stock} unidades`);

    // 2. Lógica de Decisão (Goldratt Constraints)
    if (stock === 0) {
      // Prioridade 1: Parar o sangramento total
      await this.meta.pauseAdSet(adSetId);
    } 
    else if (stock < 5) {
      // Prioridade 2: "Soft-Cap" (Preservar algoritmo com pouco estoque)
      await this.meta.applySoftCap(adSetId, originalBudget);
    } 
    else {
      // Prioridade 3: Escala total (Estoque saudável)
      await this.meta.restoreBudget(adSetId, originalBudget);
    }
  }
}

// Demonstração do Fluxo
const engine = new ProfitBridgeEngine('bling_key_123', 'meta_token_456');

// Simulando um monitoramento de um SKU específico
engine.syncProductToAd('CAMISA-PRETA-G', 'ads_789', 10000); // R$ 100,00 de budget original
