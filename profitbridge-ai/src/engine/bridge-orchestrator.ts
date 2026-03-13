import { DOIEngine } from './doi-engine';
import { GoogleAdsCampaignService } from '../services/google-ads/campaign.service';

export class BridgeOrchestrator {
  constructor(private gadsService: GoogleAdsCampaignService) {}

  async evaluateAndAction(context: {
    skuId: string;
    stock: number;
    avgSales: number;
    adGroupId: string;
    safeThreshold: number;
  }) {
    const doi = DOIEngine.calculateDOI(context.stock, context.avgSales);
    const mustPause = DOIEngine.shouldPause(doi, context.safeThreshold);

    if (mustPause) {
      console.log(`[KillSwitch] DOI crítico (${doi}). Pausando AdGroup ${context.adGroupId} para o SKU ${context.skuId}`);
      await this.gadsService.pauseAdGroup(context.adGroupId);
      return { action: 'PAUSED', doi };
    }

    return { action: 'NONE', doi };
  }
}
