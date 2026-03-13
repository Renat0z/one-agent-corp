export class NotificationDispatcher {
  async sendRoiAlert(shopName: string, amountSaved: number) {
    if (amountSaved <= 0) return;

    const message = `🌟 [ProfitBridge] ${shopName}: Hoje a IA salvou $${amountSaved} em gastos desperdiçados no Google Ads!`;
    
    // Simulação de envio para Slack/WhatsApp
    console.log(`[Notification SENT to ${shopName}]: ${message}`);
  }
}
