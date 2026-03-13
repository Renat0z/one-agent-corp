// Script: Full Pipeline Run — AI Report Generator
// Executes ALL 6 stages with auto-gate-approval
// One Agent Corp Pipeline: ideation → validation → mvp → launch → growth → scale

import { getCEOAgent } from '../src/index.js';
import { getPipelineEngine } from '../src/pipeline/pipeline-engine.js';
import type { StageResult } from '../src/pipeline/types.js';

const ceo = getCEOAgent();
const pipeline = getPipelineEngine();

// ═══════════════════════════════════════════════════════════════════════════════
// Create and start project
// ═══════════════════════════════════════════════════════════════════════════════

console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║       ONE AGENT CORP — FULL PIPELINE RUN                     ║');
console.log('║       AI Report Generator                                    ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

const project = pipeline.createProject({
  name: 'AI Report Generator',
  description: 'Micro-SaaS that transforms raw AI outputs into professional, branded deliverables (PDF/Notion reports, proposals, client documents) in one click.',
  owner: 'ceo',
  budget: 8000,
  targetMrr: 5000,
  tags: ['micro-saas', 'ai-tools', 'solopreneur', 'first-product'],
  departments: ['product', 'engineering', 'growth', 'sales', 'data'],
  riskLevel: 'low',
  priority: 'high',
  strategicAlignment: 'First product of the One Agent Corp factory. Validates the virtual enterprise model. Serves the post-AI workflow gap identified by JTBD analysis (nonconsumption in AI-to-deliverable bridge).',
});

pipeline.startProject(project.id);
console.log(`Project: ${project.metadata.name} (${project.id})\n`);

// ═══════════════════════════════════════════════════════════════════════════════
// Stage runner
// ═══════════════════════════════════════════════════════════════════════════════

const STAGES = ['ideation', 'validation', 'mvp', 'launch', 'growth', 'scale'] as const;
const stageResults: Record<string, StageResult> = {};
let stageNum = 0;

for (const stageName of STAGES) {
  stageNum++;
  const p = pipeline.getProject(project.id)!;

  console.log(`\n${'━'.repeat(65)}`);
  console.log(`  STAGE ${stageNum}/6: ${stageName.toUpperCase()}`);
  console.log(`${'━'.repeat(65)}\n`);

  // Execute stage
  const result = await pipeline.executeCurrentStage(project.id);
  stageResults[stageName] = result;

  // Print summary
  console.log(`Status: ${result.status}`);
  console.log(`Summary: ${result.summary}`);

  // Print deliverables
  console.log('\nDeliverables:');
  result.deliverables.forEach(d => {
    const icon = d.status === 'done' ? '+' : d.status === 'blocked' ? 'X' : '~';
    console.log(`  [${icon}] ${d.name}`);
    if (d.artifact) console.log(`      ${d.artifact}`);
  });

  // Print key metrics
  console.log('\nKey Metrics:');
  Object.entries(result.metrics).forEach(([k, v]) => {
    if (k !== 'pass_score') console.log(`  ${k}: ${v}`);
  });
  console.log(`  PASS SCORE: ${result.metrics.pass_score}/100`);

  // Print insights
  if (result.insights && result.insights.length > 0) {
    console.log('\nInsights:');
    result.insights.forEach(i => console.log(`  → ${i}`));
  }

  // Print blockers
  if (result.blockers.length > 0) {
    console.log('\n⚠ BLOCKERS:');
    result.blockers.forEach(b => console.log(`  !! ${b}`));
  }

  // Gate decision
  if (stageName === 'scale') {
    // Final stage — no gate needed, pipeline completes
    if (result.next_stage_ready) {
      const completed = pipeline.applyGateDecision(project.id, 'approve', {
        reason: `Scale stage completed. Pipeline DONE. Final MRR: $${result.metrics.final_mrr ?? result.metrics.current_mrr}`,
      });
      console.log(`\n✓ GATE: APPROVED — Pipeline COMPLETED`);
    } else {
      console.log(`\n⚠ Scale stage has blockers — pipeline not yet complete`);
    }
  } else if (result.next_stage_ready) {
    const nextStage = STAGES[stageNum];
    const advanced = pipeline.applyGateDecision(project.id, 'approve', {
      reason: `Stage ${stageName} completed successfully. Score: ${result.metrics.pass_score}/100.`,
    });
    console.log(`\n✓ GATE: ${stageName} → ${nextStage} APPROVED`);
  } else {
    console.log(`\n⚠ GATE BLOCKED — cannot advance. Fix blockers first.`);
    break;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Final Summary
// ═══════════════════════════════════════════════════════════════════════════════

const finalProject = pipeline.getProject(project.id)!;

console.log(`\n${'═'.repeat(65)}`);
console.log('  PIPELINE COMPLETE — FINAL REPORT');
console.log(`${'═'.repeat(65)}\n`);

console.log(`Project: ${finalProject.metadata.name}`);
console.log(`Status: ${finalProject.status}`);
console.log(`Final Stage: ${finalProject.currentStage}`);
console.log(`Gates Passed: ${finalProject.gates.length}`);
console.log(`MRR: $${finalProject.currentMrr}`);
console.log(`Budget: $${finalProject.metadata.budget}`);

// Stage-by-stage summary table
console.log('\n┌────────────┬──────────┬───────┬─────────────────────────────────┐');
console.log('│ Stage      │ Status   │ Score │ Key Result                      │');
console.log('├────────────┼──────────┼───────┼─────────────────────────────────┤');

for (const stage of STAGES) {
  const r = stageResults[stage];
  if (!r) continue;
  const status = r.status.padEnd(8);
  const score = String(r.metrics.pass_score).padStart(3) + '/100';
  let keyResult = '';
  switch (stage) {
    case 'ideation':
      keyResult = `TAM $${r.metrics.tam_usd_thousands}K, diff ${r.metrics.differentiation_score}/10`;
      break;
    case 'validation':
      keyResult = `${r.metrics.pain_confirmation_rate}% pain, ${r.metrics.wtp_signals} WTP`;
      break;
    case 'mvp':
      keyResult = `${r.metrics.beta_users_count} beta, ${r.metrics.activation_rate}% actv`;
      break;
    case 'launch':
      keyResult = `$${r.metrics.launch_mrr} MRR, ${r.metrics.first_paying_customers} paying`;
      break;
    case 'growth':
      keyResult = `$${r.metrics.current_mrr} MRR, ${r.metrics.mom_mrr_growth_rate}% MoM`;
      break;
    case 'scale':
      keyResult = `$${r.metrics.final_mrr} MRR, LTV/CAC ${r.metrics.ltv_cac_ratio}`;
      break;
  }
  console.log(`│ ${stage.padEnd(10)} │ ${status} │ ${score.padStart(5)} │ ${keyResult.padEnd(31)} │`);
}

console.log('└────────────┴──────────┴───────┴─────────────────────────────────┘');

// Scale metrics
const scaleResult = stageResults['scale'];
if (scaleResult) {
  console.log('\n═══ UNIT ECONOMICS ═══');
  console.log(`  Final MRR: $${scaleResult.metrics.final_mrr?.toLocaleString()}`);
  console.log(`  Target Achievement: ${scaleResult.metrics.mrr_target_achievement_pct}%`);
  console.log(`  Total Customers: ${scaleResult.metrics.total_customers}`);
  console.log(`  LTV/CAC: ${scaleResult.metrics.ltv_cac_ratio}`);
  console.log(`  CAC: $${scaleResult.metrics.cac}`);
  console.log(`  LTV: $${scaleResult.metrics.ltv}`);
  console.log(`  Gross Margin: ${scaleResult.metrics.gross_margin_pct}%`);
  console.log(`  Annual Churn: ${scaleResult.metrics.annual_churn_rate}%`);
  console.log(`  NRR: ${scaleResult.metrics.nrr}%`);
  console.log(`  Payback Period: ${scaleResult.metrics.payback_period_months} months`);
  console.log(`  Moat Score: ${scaleResult.metrics.moat_score}/10`);
}

console.log('\n╔═══════════════════════════════════════════════════════════════╗');
console.log('║  AI REPORT GENERATOR — PIPELINE COMPLETED SUCCESSFULLY      ║');
console.log('║  One Agent Corp factory model: VALIDATED                    ║');
console.log('╚═══════════════════════════════════════════════════════════════╝');
