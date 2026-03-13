export interface AuditRecord {
  date: string;
  skuId: string;
  wastedSpend: number;
  reason: string;
}

export class RetroactiveAuditor {
  /**
   * Lógica Cross-Platform: Identifica discrepâncias que ferramentas isoladas não veem.
   */
  static async analyzeHistory(shopData: any[], adData: any[]): Promise<AuditRecord[]> {
    const records: AuditRecord[] = [];
    
    shopData.forEach(item => {
      const adsForProduct = adData.filter(ad => ad.skuId === item.id);
      
      adsForProduct.forEach(ad => {
        // Regra 1: Estoque Zero (Hemorragia Clássica)
        if (item.historicalStock[ad.date] <= 0 && ad.spend > 0) {
          records.push({
            date: ad.date,
            skuId: item.id,
            wastedSpend: ad.spend,
            reason: "Produto sem estoque físico"
          });
        }
        
        // Regra 2: Margem Negativa (Hemorragia de ROAS Ilusório)
        // Se Custo de Anúncio > Margem Bruta por venda estimada
        const estimatedProfit = item.price - item.cogs;
        if (ad.costPerSale > estimatedProfit) {
          records.push({
            date: ad.date,
            skuId: item.id,
            wastedSpend: ad.spend * 0.4, // Estimativa de 40% do spend sendo prejuízo direto
            reason: "Custo de Aquisição (CPA) maior que a Margem Líquida"
          });
        }
      });
    });

    return records;
  }
}
