export class SuccessReporter {
  generateWeeklyUpdate(customerName: string, savings: number, itemsPaused: number): string {
    return `🚀 Boas notícias, ${customerName}!
Esta semana, o ProfitBridge AI economizou $${savings} para você.
Pausamos automaticamente ${itemsPaused} anúncios de produtos que ficaram sem estoque, evitando cliques inúteis.
Seu lucro líquido agradece! Alguma dúvida sobre os logs?`;
  }
}
