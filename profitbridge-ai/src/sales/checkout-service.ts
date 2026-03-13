export class CheckoutService {
  generateHormoziLink(shopName: string, plan: 'starter' | 'pro'): string {
    const baseUrl = "https://checkout.profitbridge.ai";
    const trialDays = 30;
    const guarantee = "ROI_3X_OR_FREE";
    
    return `${baseUrl}/${plan}?shop=${shopName}&trial=${trialDays}&ref=${guarantee}`;
  }

  getOfferStack() {
    return [
      "30 Dias de Teste Grátis",
      "Garantia de Economia 3x",
      "Setup Concierge (Incluso)",
      "Relatório de Skus Vampiros"
    ];
  }
}
