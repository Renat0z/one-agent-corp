export class BidAdjuster {
  /**
   * Retorna o multiplicador de lance baseado no DOI
   * 1.0 = normal, 0.2 = lance reduzido em 80%
   */
  static getBidMultiplier(doi: number): number {
    if (doi <= 1) return 0.05; // Praticamente pausa
    if (doi <= 2) return 0.2;  // Reduz drasticamente
    if (doi <= 5) return 0.7;  // Começa a frear
    return 1.0;                // Estoque saudável
  }
}
