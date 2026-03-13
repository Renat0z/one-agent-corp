export interface AuditRecord {
  date: string;
  skuId: string;
  wastedSpend: number;
  missedProfit: number;
}

export class RetroactiveAuditor {
  /**
   * Simula a análise de 90 dias cruzando estoque e gasto
   */
  static async analyzeHistory(shopData: any[], adData: any[]): Promise<AuditRecord[]> {
    const records: AuditRecord[] = [];
    
    // Lógica simplificada: Se estoque era 0 mas houve clique pago
    shopData.forEach(item => {
      const adsForProduct = adData.filter(ad => ad.skuId === item.id);
      
      adsForProduct.forEach(ad => {
        if (item.historicalStock[ad.date] <= 0 && ad.spend > 0) {
          records.push({
            date: ad.date,
            skuId: item.id,
            wastedSpend: ad.spend,
            missedProfit: item.price - item.cogs
          });
        }
      });
    });

    return records;
  }
}
