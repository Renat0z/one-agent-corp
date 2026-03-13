import { RetroactiveAuditor } from '../lib/auditor/retro-service';
import { AuditReportBuilder } from '../lib/auditor/report-builder';

export default async function handler(req: any, res: any) {
  const mockShopData = [
    { id: '1', price: 100, cogs: 50, historicalStock: { '2026-03-10': 0 } }
  ];
  const mockAdData = [
    { skuId: '1', spend: 250, date: '2026-03-10' }
  ];

  const records = await RetroactiveAuditor.analyzeHistory(mockShopData, mockAdData);
  const diagnosis = AuditReportBuilder.generateDiagnosis(records);

  res.status(200).json(diagnosis);
}
