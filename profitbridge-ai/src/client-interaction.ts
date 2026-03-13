import { SalesCloserAgent } from './sales/objection-handler';
import { CheckoutService } from './sales/checkout-service';
import { SuccessReporter } from './sales/success-reporter';

export class ClientInteractionHub {
  private closer = new SalesCloserAgent();
  private checkout = new CheckoutService();
  private reporter = new SuccessReporter();

  /**
   * Passo 1: Lidar com a primeira objeção após enviar o relatório
   */
  handleObjection(type: 'security' | 'complexity' | 'competition') {
    const response = this.closer.generateResponse(type);
    console.log(`[Agente -> Cliente]: ${response}`);
    return response;
  }

  /**
   * Passo 2: Enviar a Oferta Grand Slam
   */
  sendOffer(shopName: string) {
    const link = this.checkout.generateHormoziLink(shopName, 'pro');
    const stack = this.checkout.getOfferStack().join('\n - ');
    const msg = `Perfeito! Aqui está sua oferta de acesso antecipado:\n - ${stack}\n\nLink para ativar seu trial de 30 dias: ${link}`;
    console.log(`[Agente -> Cliente]: ${msg}`);
  }

  /**
   * Passo 3: Relatório de Pós-Venda (Retenção)
   */
  notifySuccess(name: string, savings: number) {
    const msg = this.reporter.generateWeeklyUpdate(name, savings, 12);
    console.log(`[Agente -> Cliente]: ${msg}`);
  }
}
