export interface ProductCosts {
  cogs: number;
  shipping: number;
  gatewayFeePercent: number;
}

export class ProfitCalculator {
  static calculateNetMargin(price: number, costs: ProductCosts): number {
    const fees = price * (costs.gatewayFeePercent / 100);
    const net = price - (costs.cogs + costs.shipping + fees);
    return Math.round(net * 100) / 100;
  }

  static isProfitable(price: number, costs: ProductCosts, minMargin: number): boolean {
    return this.calculateNetMargin(price, costs) >= minMargin;
  }
}
