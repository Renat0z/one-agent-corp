// Script: Execute Ideation Stage + Gate Approval for AI Report Generator
// One Agent Corp Pipeline — Stage 1/6

import { getCEOAgent } from '../src/index.js';
import { getPipelineEngine } from '../src/pipeline/pipeline-engine.js';

const ceo = getCEOAgent();
const pipeline = getPipelineEngine();

// ═══════════════════════════════════════════════════════════════════════════════
// Recreate project state (pipeline is in-memory)
// ═══════════════════════════════════════════════════════════════════════════════

console.log('═══ ONE AGENT CORP — PIPELINE: IDEATION STAGE ═══\n');

const project = pipeline.createProject({
  name: 'AI Report Generator',
  description: 'Micro-SaaS that transforms raw AI outputs into professional, branded deliverables (PDF/Notion reports, proposals, client documents) in one click.',
  owner: 'ceo',
  budget: 8000,
  targetMrr: 5000,
  tags: ['micro-saas', 'ai-tools', 'solopreneur', 'first-product'],
  departments: ['product', 'engineering', 'growth', 'sales', 'data'],
  strategicAlignment: 'First product of the One Agent Corp factory. Validates the virtual enterprise model. Serves the post-AI workflow gap identified by JTBD analysis (nonconsumption in AI-to-deliverable bridge).',
});

pipeline.startProject(project.id);
console.log(`Project: ${project.metadata.name} (${project.id})`);
console.log(`Stage: ${project.currentStage}`);
console.log(`Status: in-progress\n`);

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 1: Execute Ideation Stage
// ═══════════════════════════════════════════════════════════════════════════════

console.log('─── EXECUTING IDEATION STAGE ───\n');

const stageResult = await pipeline.executeCurrentStage(project.id);

console.log(`Stage: ${stageResult.stage}`);
console.log(`Status: ${stageResult.status}`);
console.log(`Summary: ${stageResult.summary}`);
console.log(`Next Stage Ready: ${stageResult.next_stage_ready}`);

console.log('\nDeliverables:');
stageResult.deliverables.forEach(d => {
  console.log(`  [${d.status.toUpperCase()}] ${d.name}`);
  if (d.artifact) console.log(`         → ${d.artifact}`);
});

console.log('\nMetrics:');
Object.entries(stageResult.metrics).forEach(([k, v]) => {
  console.log(`  ${k}: ${v}`);
});

console.log('\nInsights:');
stageResult.insights?.forEach(i => console.log(`  → ${i}`));

if (stageResult.blockers.length > 0) {
  console.log('\nBLOCKERS:');
  stageResult.blockers.forEach(b => console.log(`  !! ${b}`));
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 2: Gate Approval (auto-approve if ready)
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n─── GATE: IDEATION → VALIDATION ───\n');

if (stageResult.next_stage_ready) {
  const advanced = pipeline.applyGateDecision(project.id, 'approve', {
    reason: `Ideation stage completed successfully. TAM: $${stageResult.metrics.tam_usd_thousands}K, ${stageResult.metrics.competitors_analyzed} competitors analyzed, differentiation score: ${stageResult.metrics.differentiation_score}/10. Pass score: ${stageResult.metrics.pass_score}/100.`,
  });

  console.log(`Gate Decision: APPROVED`);
  console.log(`Advanced to: ${advanced.currentStage}`);
  console.log(`New Status: ${advanced.status}`);
} else {
  console.log('Gate Decision: BLOCKED — stage not ready');
  console.log('Blockers:');
  stageResult.blockers.forEach(b => console.log(`  - ${b}`));
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 3: Show updated project state
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n─── UPDATED PROJECT STATE ───\n');

const updatedProject = pipeline.getProject(project.id)!;
console.log(`Project: ${updatedProject.metadata.name}`);
console.log(`Current Stage: ${updatedProject.currentStage}`);
console.log(`Status: ${updatedProject.status}`);
console.log(`MRR: $${updatedProject.currentMrr} / $${updatedProject.metadata.targetMrr}`);
console.log(`Gates Passed: ${updatedProject.gates.length}`);

// ═══════════════════════════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n═══ IDEATION COMPLETE — NEXT: VALIDATION ═══');
console.log('');
console.log('Validation stage deliverables (14 days):');
console.log('  - User interviews (20+ solopreneurs)');
console.log('  - Survey results on AI-to-deliverable workflow pain');
console.log('  - Landing page test with conversion tracking');
console.log('  - Willingness-to-pay analysis ($49/mo hypothesis)');
console.log('  - Competitive positioning map');
console.log('');
console.log('Key departments: Product, Growth, Data');
console.log('');
console.log('Run /oac-pipeline ACTION="advance" to execute validation stage.');
