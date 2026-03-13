import { AuditRecord } from './retro-service';

export class AuditReportBuilder {
  static generateDiagnosis(records: AuditRecord[]) {
    const totalWasted = records.reduce((sum, r) => sum + r.wastedSpend, 0);
    const affectedSkus = new Set(records.map(r => r.skuId)).size;

    return {
      title: "Diagnóstico de Hemorragia Financeira",
      verdict: totalWasted > 500 ? "CRÍTICO" : "ALERTA",
      message: `Identificamos $${totalWasted} jogados fora em ${affectedSkus} SKUs que estavam sem estoque.`,
      remedy: "O ProfitBridge AI pode impedir que isso aconteça novamente em menos de 5 minutos."
    };
  }
}
