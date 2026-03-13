// One Agent Corp — Growth Stage
// Domain D-5 | Stage 5/6: Growth hacking, scale acquisition, MoM MRR growth

import type { StageConfig, StageResult, Deliverable, Project } from '../types';
import { evaluatePassCriteria, deriveGateRecommendation } from '../gates';

// ─── Stage Configuration ──────────────────────────────────────────────────────

export const GROWTH_CONFIG: StageConfig = {
  name: 'growth',
  displayName: 'Growth Hacking & Acquisition Scale',
  description:
    'Execute growth experiments, build acquisition loops, achieve target MRR growth rate, reduce CAC, and improve retention.',
  departments: ['growth', 'data', 'product', 'sales'],
  estimatedDays: 60,
  deliverableTemplates: [
    {
      id: 'growth-experiments',
      name: 'Growth Experiments Log',
      description: '≥5 growth experiments run with results: variant, metric, winner/loser, next action',
      owner: 'growth',
    },
    {
      id: 'acquisition-channels',
      name: 'Acquisition Channel Analysis',
      description: 'Top 3 channels ranked by CAC, conversion rate, and volume. Double-down recommendation.',
      owner: 'data',
    },
    {
      id: 'retention-improvements',
      name: 'Retention Improvement Report',
      description: 'Before/after retention metrics after product and onboarding changes',
      owner: 'product',
    },
    {
      id: 'referral-program',
      name: 'Referral Program',
      description: 'Implemented referral loop with incentive structure and tracking',
      owner: 'growth',
    },
    {
      id: 'content-engine',
      name: 'Content Engine Setup',
      description: 'SEO content pipeline: keyword clusters, 5+ published pieces, organic traffic baseline',
      owner: 'growth',
    },
    {
      id: 'growth-metrics-dashboard',
      name: 'Growth Metrics Dashboard',
      description: 'Live dashboard: MRR, MoM growth %, CAC, LTV, churn, activation, retention cohorts',
      owner: 'data',
    },
    {
      id: 'expansion-revenue',
      name: 'Expansion Revenue Path',
      description: 'Upsell/cross-sell strategy and first expansion MRR captured',
      owner: 'sales',
    },
  ],
  passCriteria: [
    {
      id: 'mom_mrr_growth_rate',
      description: '≥ 15% MoM MRR growth rate',
      metric: 'mom_mrr_growth_rate',
      minValue: 15,
      required: true,
    },
    {
      id: 'monthly_mrr',
      description: 'MRR ≥ 25% of target MRR',
      metric: 'mrr_target_pct',
      minValue: 25,
      required: true,
    },
    {
      id: 'cac_trend',
      description: 'CAC declining or stable (CAC trend ≤ 0)',
      metric: 'cac_trend',
      minValue: -999,
      required: false,
    },
    {
      id: 'month3_retention',
      description: '≥ 70% month-3 retention',
      metric: 'month3_retention',
      minValue: 70,
      required: true,
    },
    {
      id: 'growth-experiments',
      description: '≥ 5 growth experiments completed',
      required: false,
    },
    {
      id: 'viral_coefficient',
      description: 'Viral coefficient K ≥ 0.3',
      metric: 'viral_coefficient',
      minValue: 0.3,
      required: false,
    },
  ],
  gateLabel: 'Growth Gate — Is the growth engine working? Predictable, scalable?',
};

// ─── Stage Executor ───────────────────────────────────────────────────────────

/**
 * Executes the Growth stage for a given project.
 * Simulates growth + data + product: experiments, channels, retention improvements.
 * D-6 playbooks integrate here: growth-hacking playbook strategies are applied.
 */
export function executeGrowth(project: Project): StageResult {
  const now = new Date().toISOString();
  const metadata = project.metadata;

  // Carry forward from launch
  const launchResult = project.stageResults['launch'];
  const launchMrr = launchResult?.metrics['launch_mrr'] ?? 0;
  const launchCustomers = launchResult?.metrics['first_paying_customers'] ?? 0;
  const launchCac = launchResult?.metrics['cac'] ?? 500;

  // Growth stage outcomes
  const experimentsRun = 7;
  const experimentsWon = 3;
  const momGrowthRate = simulateMoMGrowth(metadata.riskLevel, launchMrr, metadata.targetMrr);
  const currentMrr = Math.round(launchMrr * Math.pow(1 + momGrowthRate / 100, 2)); // 2 months of growth
  const mrrTargetPct = Math.round((currentMrr / metadata.targetMrr) * 100);
  const month3Retention = simulateMonth3Retention(metadata.riskLevel);
  const newCac = Math.round(launchCac * 0.85); // 15% improvement
  const cacTrend = newCac - launchCac;
  const viralCoefficient = simulateViral(metadata.riskLevel);
  const totalCustomers = Math.round(launchCustomers * Math.pow(1 + momGrowthRate / 100, 2));
  const expansionMrr = Math.round(currentMrr * 0.08); // 8% expansion revenue

  const deliverables: Deliverable[] = GROWTH_CONFIG.deliverableTemplates.map(template => {
    let status: Deliverable['status'] = 'done';
    let artifact: string | undefined;

    switch (template.id) {
      case 'growth-experiments':
        artifact = `${experimentsRun} experiments run. ${experimentsWon} winners: (1) onboarding email sequence +22% activation, (2) in-app upsell modal +18% upgrade, (3) referral incentive $10 credit.`;
        break;
      case 'acquisition-channels':
        artifact = `Top channels: (1) Content/SEO — CAC $${Math.round(newCac * 0.7)}, (2) Referral — CAC $${Math.round(newCac * 0.5)}, (3) Paid — CAC $${Math.round(newCac * 1.4)}. Recommendation: 2x content + referral.`;
        break;
      case 'retention-improvements':
        artifact = `Month-3 retention improved from ${Math.round(month3Retention * 0.8)}% → ${month3Retention}%. Key change: 4-step onboarding wizard replacing free-form setup.`;
        break;
      case 'referral-program':
        artifact = `Referral: give $10 credit, get $10 credit. K=${viralCoefficient}. ${Math.round(totalCustomers * viralCoefficient)} referral customers acquired.`;
        break;
      case 'content-engine':
        artifact = `8 SEO articles published. Top cluster: "${metadata.name} alternatives". Organic traffic: ${Math.round(totalCustomers * 15)} visits/month.`;
        break;
      case 'growth-metrics-dashboard':
        artifact = `Live Looker Studio dashboard. Metrics: MRR $${currentMrr.toLocaleString()}, MoM ${momGrowthRate}%, CAC $${newCac}, LTV ${Math.round(currentMrr / totalCustomers * 18)}.`;
        break;
      case 'expansion-revenue':
        status = expansionMrr > 0 ? 'done' : 'in-progress';
        artifact = `Expansion MRR: $${expansionMrr.toLocaleString()} (plan upgrades). ${Math.round(totalCustomers * 0.12)} customers upgraded to Pro tier.`;
        break;
      default:
        status = 'pending';
    }

    return {
      ...template,
      status,
      completedAt: status === 'done' ? now : undefined,
      artifact,
    };
  });

  const metrics: Record<string, number> = {
    current_mrr: currentMrr,
    mom_mrr_growth_rate: momGrowthRate,
    mrr_target_pct: mrrTargetPct,
    month3_retention: month3Retention,
    cac: newCac,
    cac_trend: cacTrend,
    viral_coefficient: viralCoefficient,
    experiments_run: experimentsRun,
    experiments_won: experimentsWon,
    total_customers: totalCustomers,
    expansion_mrr: expansionMrr,
    pass_score: 0,
  };

  const evaluation = evaluatePassCriteria(GROWTH_CONFIG.passCriteria, {
    stage: 'growth',
    status: 'success',
    deliverables,
    metrics,
    blockers: [],
    next_stage_ready: false,
    summary: '',
    completedAt: now,
    insights: [],
  });

  metrics.pass_score = evaluation.score;

  const blockers: string[] = [];
  if (momGrowthRate < 15) blockers.push(`MoM growth ${momGrowthRate}% below 15% target`);
  if (mrrTargetPct < 25) blockers.push(`MRR at ${mrrTargetPct}% of target — need ≥25%`);
  if (month3Retention < 70) blockers.push(`Month-3 retention ${month3Retention}% below 70%`);

  const nextStageReady = blockers.length === 0;

  const { recommendation, rationale } = deriveGateRecommendation(
    evaluation,
    {
      stage: 'growth',
      status: blockers.length > 0 ? 'blocked' : 'success',
      deliverables,
      metrics,
      blockers,
      next_stage_ready: nextStageReady,
      summary: '',
      completedAt: now,
      insights: [],
    }
  );

  const insights: string[] = [
    `MRR: $${currentMrr.toLocaleString()} (${mrrTargetPct}% of target). MoM growth: ${momGrowthRate}%`,
    `Month-3 retention: ${month3Retention}%. CAC: $${newCac} (${Math.abs(cacTrend)}% ${cacTrend <= 0 ? 'improvement' : 'increase'})`,
    `Viral coefficient K=${viralCoefficient} — ${viralCoefficient >= 0.5 ? 'viral loops working' : 'referral needs more incentive'}`,
    `${experimentsWon}/${experimentsRun} experiments won. Growth is systematic.`,
    `Recommendation: ${recommendation} — ${rationale}`,
  ];

  return {
    stage: 'growth',
    status: blockers.length > 0 ? 'blocked' : 'success',
    deliverables,
    metrics,
    blockers,
    next_stage_ready: nextStageReady,
    summary: `Growth stage: $${currentMrr.toLocaleString()} MRR, ${momGrowthRate}% MoM, ${month3Retention}% month-3 retention, ${totalCustomers} customers.`,
    completedAt: now,
    insights,
  };
}

// ─── Simulation Helpers ────────────────────────────────────────────────────────

function simulateMoMGrowth(riskLevel: string, launchMrr: number, targetMrr: number): number {
  const base: Record<string, number> = { low: 22, medium: 17, high: 12 };
  const headroom = launchMrr < targetMrr * 0.2 ? 3 : 0; // extra growth when far from target
  return (base[riskLevel] ?? 17) + headroom;
}

function simulateMonth3Retention(riskLevel: string): number {
  const base: Record<string, number> = { low: 78, medium: 72, high: 65 };
  return base[riskLevel] ?? 72;
}

function simulateViral(riskLevel: string): number {
  const base: Record<string, number> = { low: 0.55, medium: 0.38, high: 0.22 };
  return base[riskLevel] ?? 0.38;
}

// ─── Stage Entry/Exit Hooks ────────────────────────────────────────────────────

export function enterGrowth(project: Project): void {
  if (project.currentStage !== 'growth') {
    throw new Error(`enterGrowth: project is in stage '${project.currentStage}', not 'growth'`);
  }
}

export function exitGrowth(result: StageResult): void {
  if (result.stage !== 'growth') {
    throw new Error(`exitGrowth: unexpected stage '${result.stage}'`);
  }
}
