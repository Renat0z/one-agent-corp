/**
 * ProfitBridge AI - ROI Calculator Engine
 * Esta lógica será o coração do Lead Magnet.
 */

interface ROICalculatorInput {
  monthlyAdSpend: number;
  avgRoas: number;
  outOfStockRate: number; // Porcentagem de SKUs ativos em ads que ficam sem estoque (0-100)
  avgMargin: number;      // Margem de lucro média (0-100)
  softwareCost: number;   // Custo mensal do ProfitBridge
}

interface ROIResult {
  monthlyWastedSpend: number;
  lostRevenue: number;
  lostProfit: number;
  totalMonthlyLeak: number;
  annualLeak: number;
  roiOnSoftware: number; // Quantas vezes a ferramenta se paga
}

export function calculateProfitLeak(input: ROICalculatorInput): ROIResult {
  const { monthlyAdSpend, avgRoas, outOfStockRate, avgMargin, softwareCost } = input;
  
  // 1. Dinheiro jogado no lixo (Anúncios rodando para produtos sem estoque)
  const monthlyWastedSpend = monthlyAdSpend * (outOfStockRate / 100);
  
  // 2. Receita que deixou de existir porque o dinheiro foi mal alocado
  // Se esse dinheiro "Wasted" fosse usado em produtos com estoque, quanto geraria?
  const lostRevenue = monthlyWastedSpend * avgRoas;
  
  // 3. Lucro líquido perdido (Receita perdida * margem)
  const lostProfit = lostRevenue * (avgMargin / 100);
  
  // 4. Vazamento Total (Dinheiro gasto no lixo + Lucro que deixou de ganhar)
  const totalMonthlyLeak = monthlyWastedSpend + lostProfit;
  const annualLeak = totalMonthlyLeak * 12;
  
  // 5. ROI da Ferramenta (Garantia Hormozi de 3x)
  // A ferramenta visa recuperar o Wasted Spend e o Lost Profit.
  const roiOnSoftware = totalMonthlyLeak / softwareCost;

  return {
    monthlyWastedSpend,
    lostRevenue,
    lostProfit,
    totalMonthlyLeak,
    annualLeak,
    roiOnSoftware
  };
}

// Exemplo de uso para um e-commerce médio:
const exampleInput: ROICalculatorInput = {
  monthlyAdSpend: 10000, // R$ 10k/mês
  avgRoas: 4.5,          // ROAS 4.5
  outOfStockRate: 15,    // 15% dos produtos em ads ficam sem estoque
  avgMargin: 30,         // 30% de margem
  softwareCost: 297      // Mensalidade estimada
};

const result = calculateProfitLeak(exampleInput);
console.log("=== RELATÓRIO DE VAZAMENTO DE LUCRO (ProfitBridge AI) ===");
console.log(`Gasto Desperdiçado: R$ ${result.monthlyWastedSpend.toFixed(2)}`);
console.log(`Lucro Líquido Perdido: R$ ${result.lostProfit.toFixed(2)}`);
console.log(`Vazamento Total Mensal: R$ ${result.totalMonthlyLeak.toFixed(2)}`);
console.log(`Vazamento Anual: R$ ${result.annualLeak.toFixed(2)}`);
console.log(`ROI da Ferramenta: ${result.roiOnSoftware.toFixed(1)}x`);
