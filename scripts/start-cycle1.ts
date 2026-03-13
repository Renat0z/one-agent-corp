import { getCycleEngine, CreateCycleOptions } from '../src/cycles/cycle-engine';
import { getPipelineEngine } from '../src/pipeline/pipeline-engine';

async function startFirstCycle() {
  const projectName = "ProfitBridge AI";
  const description = "O Piloto Automático que pausa anúncios inúteis e protege seu lucro líquido.";
  
  console.log(`🌀 Inicializando Pipeline e Ciclo 1 para: ${projectName}`);
  
  // 1. Forçar a criação do projeto no PipelineEngine (Singleton em memória)
  const pipeline = getPipelineEngine();
  const project = pipeline.createProject({
    name: projectName,
    description: description,
    targetMrr: 5000,
    budget: 15000,
    timeline: "8 ciclos",
    departments: ['engineering', 'product'],
    strategicAlignment: 'Hormozi Profit-Ad-Bidding',
    riskLevel: 'medium',
    priority: 'high',
  });
  
  pipeline.startProject(project.id);
  console.log(`✅ Projeto Inicializado no Pipeline: ${project.id}`);

  // 2. Criar o Ciclo 1 (Conectividade)
  const cycleEngine = getCycleEngine();
  const cycleOpts: CreateCycleOptions = {
    projectId: project.id,
    hypothesis: "Se validarmos a conectividade OAuth com Shopify e Google Ads, poderemos extrair dados reais de inventário e bidding em menos de 1 ciclo.",
    minimumTest: "Criar um script Node.js que autentique via OAuth2 e liste 5 SKUs do Shopify e 1 Campanha do Google Ads.",
    targetMetric: "connectivity_success_rate",
    targetValue: 1.0,
    department: "engineering",
    estimatedDuration: "2h",
    ice: {
      impact: 9,
      confidence: 8,
      ease: 7
    },
    tags: ["infrastructure", "auth", "cycle-1"]
  };

  const cycle = cycleEngine.createCycle(cycleOpts);
  console.log(`✅ Ciclo Criado: ${cycle.id} - ${cycle.hypothesis}`);

  // 3. Mover para Testing
  cycleEngine.startTest(cycle.id);
  console.log(`🚀 Status: TESTING`);

  console.log(`\nPróximos passos (Agente Engineering):`);
  console.log(`1. Implementar Auth Provider para Shopify/Google.`);
  console.log(`2. Testar extração de dados.`);
}

startFirstCycle().catch(console.error);
