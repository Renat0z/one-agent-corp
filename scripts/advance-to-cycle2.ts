import { getCycleEngine, CreateCycleOptions } from '../src/cycles/cycle-engine';
import { getPipelineEngine } from '../src/pipeline/pipeline-engine';

async function runFullC1Flow() {
  const pipeline = getPipelineEngine();
  const cycleEngine = getCycleEngine();
  
  // 1. Re-inicializar Projeto
  const project = pipeline.createProject({
    name: "ProfitBridge AI",
    description: "Automação de Ads baseada em Estoque",
    targetMrr: 5000,
    budget: 15000,
    timeline: "8 ciclos",
    departments: ['engineering'],
    strategicAlignment: 'Hormozi Profit-Ad-Bidding',
    riskLevel: 'medium',
    priority: 'high',
  });
  pipeline.startProject(project.id);

  // 2. Criar e Finalizar Ciclo 1
  const cycle = cycleEngine.createCycle({
    projectId: project.id,
    hypothesis: "Validar conectividade OAuth.",
    minimumTest: "Script de listagem de SKUs/Campanhas.",
    targetMetric: "connectivity_rate",
    targetValue: 1.0,
    department: "engineering",
    estimatedDuration: "2h",
    ice: { impact: 9, confidence: 9, ease: 7 }
  });

  console.log(`🌀 Ciclo ${cycle.id} criado.`);
  cycleEngine.startTest(cycle.id);
  
  cycleEngine.recordResult(cycle.id, {
    metricValue: 1.0,
    summary: "Conectividade validada via Mock Connectors.",
    insights: ["APIs prontas para integração."],
    screenshotUris: []
  });

  cycleEngine.decide(cycle.id, {
    type: 'scale',
    reason: "Fundação técnica sólida.",
    nextActions: ["Iniciar Ciclo 2 (Data Match)"]
  });

  cycleEngine.completeCycle(cycle.id);
  console.log(`✅ Ciclo 1 concluído com sucesso.`);

  // 4. Iniciar Ciclo 2 (Data Match)
  const cycle2 = cycleEngine.createCycle({
    projectId: project.id,
    hypothesis: "Se criarmos um algoritmo de cruzamento via SKU ID, poderemos pausar o anúncio EXATO do produto sem estoque.",
    minimumTest: "Script que recebe SKU ID do Shopify e encontra o AdGroupID correspondente no Google Ads.",
    targetMetric: "match_accuracy",
    targetValue: 1.0,
    department: "engineering",
    estimatedDuration: "3h",
    ice: { impact: 10, confidence: 8, ease: 6 },
    tags: ["logic", "mapping", "cycle-2"]
  });

  console.log(`🚀 Ciclo 2 Criado: ${cycle2.id}`);
  cycleEngine.startTest(cycle2.id);
  console.log(`Status Ciclo 2: TESTING`);
}

runFullC1Flow().catch(console.error);
