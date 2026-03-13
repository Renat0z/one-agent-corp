export class WasteCalculator {
  /**
   * Calcula o desperdício mensal estimado
   * @param monthlySpend Gasto total em anúncios
   * @param outOfStockRate % de SKUs que ficam sem estoque (média mercado 10-15%)
   * @param delayHours Horas que o anúncio leva para ser pausado manualmente
   */
  static estimateMonthlyWaste(monthlySpend: number, outOfStockRate = 0.15, delayHours = 12): number {
    const hourlySpend = monthlySpend / (30 * 24);
    const wasteFactor = outOfStockRate * (delayHours / 24);
    return Math.round(monthlySpend * wasteFactor * 100) / 100;
  }

  static getHormoziHook(wasteAmount: number): string {
    return `Você está deixando $${wasteAmount} na mesa todos os meses. Quer que a IA recupere isso para você hoje?`;
  }
}
