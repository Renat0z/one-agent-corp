export class DOIEngine {
  /**
   * Calcula quantos dias de estoque restam
   * @param currentStock Estoque atual
   * @param avgSalesPerDay Vendas médias por dia (ex: últimos 7 dias)
   */
  static calculateDOI(currentStock: number, avgSalesPerDay: number): number {
    if (avgSalesPerDay <= 0) return 999; // Estoque "infinito"
    return Math.round((currentStock / avgSalesPerDay) * 10) / 10;
  }

  static shouldPause(doi: number, threshold: number): boolean {
    return doi <= threshold;
  }
}
