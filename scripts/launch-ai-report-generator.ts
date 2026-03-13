// Script: Launch AI Report Generator — First micro-SaaS of One Agent Corp
// Based on Strategist Team consultation (2026-03-11)

import { getCEOAgent } from '../src/index.js';
import { getPipelineEngine } from '../src/pipeline/pipeline-engine.js';
import { getCycleEngine } from '../src/cycles/cycle-engine.js';

const ceo = getCEOAgent();

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 1: Launch Project via CEO
// ═══════════════════════════════════════════════════════════════════════════════

console.log('═══ ONE AGENT CORP — PROJECT LAUNCH ═══\n');

const launchResult = ceo.execute({
  kind: 'launch-project',
  projectName: 'AI Report Generator',
  description:
    'Micro-SaaS that transforms raw AI outputs into professional, branded deliverables (PDF/Notion reports, proposals, client documents) in one click. Target: solopreneurs and freelancers who use AI daily but waste 2+ hours formatting outputs manually.',
  budget: 8000,
  targetMrr: 5000,
  timeline: '8 weeks',
  departments: ['product', 'engineering', 'growth', 'sales', 'data'],
  strategicAlignment:
    'First product of the One Agent Corp factory. Validates the virtual enterprise model. Serves the post-AI workflow gap identified by JTBD analysis (nonconsumption in AI-to-deliverable bridge).',
  riskLevel: 'low',
  priority: 'high',
});

console.log(`Launch Status: ${launchResult.status}`);
console.log(`Command: ${launchResult.command}`);
if (launchResult.data) {
  const data = launchResult.data as { projectId: string; decision: string };
  console.log(`Project ID: ${data.projectId}`);
  console.log(`Decision: ${data.decision}`);
}
if (launchResult.reason) {
  console.log(`Reason: ${launchResult.reason}`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 2: Create Pipeline Project
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n═══ PIPELINE — CREATE & START ═══\n');

const pipeline = getPipelineEngine();
const projectId = (launchResult.data as { projectId: string })?.projectId ?? 'proj-air-gen';

const pipelineProject = pipeline.createProject({
  name: 'AI Report Generator',
  description: 'AI-to-deliverable bridge for solopreneurs',
  owner: 'ceo',
  budget: 8000,
  targetMrr: 5000,
  tags: ['micro-saas', 'ai-tools', 'solopreneur', 'first-product'],
});

pipeline.startProject(pipelineProject.id);

console.log(`Pipeline Project ID: ${pipelineProject.id}`);
console.log(`Current Stage: ${pipelineProject.currentStage}`);
console.log(`Status: ${pipelineProject.status}`);

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 3: Create First Experimentation Cycle (highest ICE)
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n═══ CYCLE — FIRST EXPERIMENT ═══\n');

const cycleEngine = getCycleEngine();

const cycle1 = cycleEngine.createCycle({
  projectId: pipelineProject.id,
  hypothesis: 'Se oferecermos um "AI Report Generator" que converte output bruto de IA em PDF profissional em 1 clique, solopreneurs pagarao $49/mes porque elimina 2h+ de trabalho manual de formatacao por semana.',
  minimumTest: 'Landing page com demo video de 60s + formulario de pre-cadastro. Postar em 5 comunidades de solopreneurs (IndieHackers, r/SaaS, Twitter AI builders). Meta: 50 pre-cadastros em 7 dias.',
  targetMetric: 'pre_signups',
  targetValue: 50,
  department: 'growth',
  estimatedDuration: '7d',
  ice: { impact: 9, confidence: 7, ease: 8 },
});

console.log(`Cycle ID: ${cycle1.id}`);
console.log(`Hypothesis: ${cycle1.hypothesis.substring(0, 80)}...`);
console.log(`ICE Score: I=${cycle1.iceScore.impact} C=${cycle1.iceScore.confidence} E=${cycle1.iceScore.ease} => ${((cycle1.iceScore.impact + cycle1.iceScore.confidence + cycle1.iceScore.ease) / 3).toFixed(1)}`);
console.log(`Status: ${cycle1.status}`);
console.log(`Department: ${cycle1.department}`);

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 4: Create Second Cycle (CTA copy test — quick win)
// ═══════════════════════════════════════════════════════════════════════════════

const cycle2 = cycleEngine.createCycle({
  projectId: pipelineProject.id,
  hypothesis: 'Se mudarmos o CTA da landing de "Sign Up" para "Generate Your First Report Free", a conversion rate sobe 40% porque reduz o time delay percebido na Value Equation.',
  minimumTest: 'A/B test no CTA da landing page. 200 visitantes minimo por variante antes de concluir.',
  targetMetric: 'cta_conversion_rate',
  targetValue: 0.12,
  department: 'growth',
  estimatedDuration: '3d',
  ice: { impact: 7, confidence: 8, ease: 10 },
});

console.log(`\nCycle 2 ID: ${cycle2.id}`);
console.log(`ICE Score: I=${cycle2.iceScore.impact} C=${cycle2.iceScore.confidence} E=${cycle2.iceScore.ease} => ${((cycle2.iceScore.impact + cycle2.iceScore.confidence + cycle2.iceScore.ease) / 3).toFixed(1)}`);

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 5: Create Third Cycle (warm outreach validation)
// ═══════════════════════════════════════════════════════════════════════════════

const cycle3 = cycleEngine.createCycle({
  projectId: pipelineProject.id,
  hypothesis: 'Se fizermos 100 outreaches diretos em comunidades de freelancers que usam IA, pelo menos 8% respondem com interesse (willingness-to-pay signal).',
  minimumTest: 'DM personalizado para 100 solopreneurs no Twitter/LinkedIn que postam sobre uso de IA. Medir taxa de resposta positiva.',
  targetMetric: 'positive_response_rate',
  targetValue: 0.08,
  department: 'sales',
  estimatedDuration: '5d',
  ice: { impact: 8, confidence: 6, ease: 7 },
});

console.log(`\nCycle 3 ID: ${cycle3.id}`);
console.log(`ICE Score: I=${cycle3.iceScore.impact} C=${cycle3.iceScore.confidence} E=${cycle3.iceScore.ease} => ${((cycle3.iceScore.impact + cycle3.iceScore.confidence + cycle3.iceScore.ease) / 3).toFixed(1)}`);

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 6: CEO Status Check
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n═══ CEO DASHBOARD — STATUS ═══\n');

const statusResult = ceo.execute({ kind: 'status', scope: 'all' });
if (statusResult.data) {
  const snapshot = (statusResult.data as { snapshot: unknown }).snapshot as Record<string, unknown>;
  if (snapshot) {
    const metrics = snapshot.companyMetrics as Record<string, unknown> | undefined;
    if (metrics) {
      console.log('Company Metrics:');
      console.log(`  Active Projects: ${metrics.activeProjects}`);
      console.log(`  Open Escalations: ${metrics.openEscalations}`);
      console.log(`  Active Cycles: ${metrics.activeCycles}`);
      console.log(`  Pending Cycle Decisions: ${metrics.pendingCycleDecisions}`);
    }
    const projects = snapshot.projects as unknown[] | undefined;
    if (projects) {
      console.log(`  Projects in Dashboard: ${projects.length}`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n═══ LAUNCH SUMMARY ═══');
console.log('');
console.log('Project: AI Report Generator');
console.log('Meta: $5K MRR ate 10/05/2026');
console.log('Budget: $8,000');
console.log('Departments: Product, Engineering, Growth, Sales, Data');
console.log('Pipeline Stage: Ideation');
console.log('');
console.log('3 Ciclos de Experimentacao Criados (por ICE score):');
console.log('  1. CTA Copy Test          — ICE 8.3 (quick win, 3 dias)');
console.log('  2. Landing + Pre-cadastro  — ICE 8.0 (validacao core, 7 dias)');
console.log('  3. Warm Outreach 100 DMs   — ICE 7.0 (demand signal, 5 dias)');
console.log('');
console.log('Proximos passos:');
console.log('  - Growth dept executa ciclo 1 (CTA test) esta semana');
console.log('  - Product dept inicia discovery e define roadmap MVP');
console.log('  - Sales dept prepara lista de 100 prospects para outreach');
console.log('  - Data dept configura tracking de metricas');
console.log('');
console.log('ABZ Planning:');
console.log('  Plan A: AI Report Generator → $5K MRR em 60 dias');
console.log('  Plan B: Templates/automacoes vendidos como pacotes one-time');
console.log('  Plan Z: Consultoria em Claude Code + agentes (lifeboat)');
console.log('');
console.log('═══ ONE AGENT CORP — FACTORY IS LIVE ═══');
