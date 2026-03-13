export class MarginCalculator {
  static calculate(price: number, cogs: number, shipping: number): number {
    const gatewayFeePercent = 0.03; 
    const estimatedCAC = 5.00; // Default placeholder
    
    const revenue = price * (1 - gatewayFeePercent);
    const totalCost = cogs + shipping + estimatedCAC;
    
    if (price <= 0) return 0;
    return (revenue - totalCost) / price;
  }
}