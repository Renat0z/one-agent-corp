import { NextResponse } from 'next/server';
import { RetroactiveAuditor } from '../../../lib/auditor/retro-service';
import { AuditReportBuilder } from '../../../lib/auditor/report-builder';

export async function POST(req: Request) {
  try {
    // Simulação de Dados de 90 dias com "Armadilhas" Reais
    const mockShopData = [
      { id: 'SKU-001', price: 200, cogs: 120, historicalStock: { '2026-03-01': 0, '2026-03-02': 0 } },
      { id: 'SKU-002', price: 50, cogs: 40, historicalStock: { '2026-03-01': 50 } } // Margem apertada
    ];
    
    const mockAdData = [
      { skuId: 'SKU-001', spend: 450, costPerSale: 0, date: '2026-03-01' }, // Queimou spend sem estoque
      { skuId: 'SKU-002', spend: 800, costPerSale: 25, date: '2026-03-01' } // CPA de 25 para margem de 10 = PREJUÍZO
    ];

    const records = await RetroactiveAuditor.analyzeHistory(mockShopData, mockAdData);
    const diagnosis = AuditReportBuilder.generateDiagnosis(records);

    return NextResponse.json({
      ...diagnosis,
      detailed_records: records
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erro no processamento de dados' }, { status: 500 });
  }
}
