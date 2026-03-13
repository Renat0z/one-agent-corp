import { WasteCalculator } from './marketing/waste-calculator';
import { OutreachService } from './marketing/outreach';
import { NotificationDispatcher } from './dashboard/notifications';
import { SavingsAggregator } from './dashboard/savings-aggregator';

export class ProfitBridgeGrowth {
  private notifier = new NotificationDispatcher();
  private outreach = new OutreachService();

  /**
   * Simula a entrada de um Lead via Lead Magnet
   */
  processLead(name: string, monthlyAdSpend: number) {
    const estimatedWaste = WasteCalculator.estimateMonthlyWaste(monthlyAdSpend);
    const hook = WasteCalculator.getHormoziHook(estimatedWaste);
    
    console.log(`[Lead Ingested]: ${name} | Spend: $${monthlyAdSpend} | Estimated Waste: $${estimatedWaste}`);
    console.log(`[Hook Generated]: ${hook}`);
    
    return { name, estimatedWaste, hook };
  }

  /**
   * Ciclo de Retenção: Notifica o cliente do valor gerado
   */
  async runRetentionCycle(shopName: string, logs: any[]) {
    const metrics = SavingsAggregator.getMetrics(logs);
    const savedAmount = parseFloat(metrics.totalSaved.replace('$', ''));
    
    await this.notifier.sendRoiAlert(shopName, savedAmount);
  }

  /**
   * Prospecção Automática
   */
  scoutAgencies(leads: Array<{ owner: string, agency: string }>) {
    console.log('🚀 Iniciando campanha de Outreach...');
    leads.forEach(lead => {
      const msg = this.outreach.generateLinkedInMessage(lead.owner, lead.agency);
      console.log(`[Campaign LinkedIn] Para ${lead.owner}: ${msg}`);
    });
  }
}
