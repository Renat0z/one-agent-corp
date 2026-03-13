import { ShopifyInventoryService } from './services/shopify/inventory.service';
import { GoogleAdsCampaignService } from './services/google-ads/campaign.service';
import { BridgeOrchestrator } from './engine/bridge-orchestrator';
import { MonitoringService } from './engine/monitoring';
import { ShadowModeGuard } from './utils/reliability';

export class ProfitBridgeApp {
  private monitor = new MonitoringService();
  private shadowGuard: ShadowModeGuard;

  constructor(
    private shopify: ShopifyInventoryService,
    private gads: GoogleAdsCampaignService,
    isShadowMode = true
  ) {
    this.shadowGuard = new ShadowModeGuard(isShadowMode);
  }

  async runSyncCycle(mappings: Array<{ skuId: string, adGroupId: string, safeThreshold: number }>) {
    console.log('🚀 Iniciando Ciclo de Sincronização ProfitBridge...');
    
    const products = await this.shopify.fetchAllProducts();
    
    for (const mapping of mappings) {
      const product = products.find((p: any) => p.id === mapping.skuId);
      if (!product) continue;

      const orchestrator = new BridgeOrchestrator(this.gads);
      
      // Simulação de velocidade de vendas (estático para MVP)
      const avgSales = 5; 

      const result = await orchestrator.evaluateAndAction({
        skuId: mapping.skuId,
        stock: product.variants[0].inventory_quantity || 0,
        avgSales,
        adGroupId: mapping.adGroupId,
        safeThreshold: mapping.safeThreshold
      });

      this.monitor.logDecision({
        timestamp: new Date().toISOString(),
        skuId: mapping.skuId,
        action: result.action as any,
        reason: `DOI calculado: ${result.doi}`,
        estimatedSaving: result.action === 'PAUSED' ? 50 : 0 // Exemplo de economia estimada
      });
    }

    console.log('✅ Ciclo concluído.');
    console.log(`💰 Economia Total Estimada: $${this.monitor.getTotalSavings()}`);
  }
}
