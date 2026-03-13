// One Agent Corp — Scale Stage
// Domain D-5 | Stage 6/6: Optimize unit economics, expand markets, build defensibility

import type { StageConfig, StageResult, Deliverable, Project } from '../types';
import { evaluatePassCriteria, deriveGateRecommendation } from '../gates';

// ─── Stage Configuration ──────────────────────────────────────────────────────

export const SCALE_CONFIG: StageConfig = {
  name: 'scale',
  displayName: 'Scale & Unit Economics Optimization',
  description:
    'Optimize unit economics (LTV/CAC), expand to new segments or geographies, build moat (integrations, data network effects, brand), and reach target MRR.',
  departments: ['operations', 'data', 'growth', 'sales', 'engineering'],
  estimatedDays: 90,
  deliverableTemplates: [
    {
      id: 'unit-economics-report',
      name: 'Unit Economics Report',
      description: 'Full P&L per customer: CAC, LTV, payback period, gross margin, contribution margin',
      owner: 'data',
    },
    {
      id: 'expansion-strategy',
      name: 'Expansion Strategy',
      description: 'Adjacent segments, geographies, or use cases. With TAM, CAC estimate, and timeline',
      owner: 'operations',
    },
    {
      id: 'integrations-ecosystem',
      name: 'Integrations Ecosystem',
      description: '≥3 strategic integrations with key tools in target segment (Zapier, API, native)',
      owner: 'engineering',
    },
    {
      id: 'churn-reduction-playbook',
      name: 'Churn Reduction Playbook',
      description: 'Health score model, at-risk customer interventions, success metrics',
      owner: 'operations',
    },
    {
      id: 'target-mrr-achieved',
      name: 'Target MRR Achievement',
      description: 'MRR ≥ 80% of original target MRR set at project launch',
      owner: 'data',
    },
    {
      id: 'operational-playbooks',
      name: 'Operational Playbooks',
      description: 'Runbooks for: customer onboarding, support escalation, billing, compliance',
      owner: 'operations',
    },
    {
      id: 'competitive-moat-analysis',
      name: 'Competitive Moat Analysis',
      description: 'Defensibility assessment: switching costs, data advantages, network effects, brand',
      owner: 'data',
    },
    {
      id: 'team-scaling-plan',
      name: 'Team Scaling Plan',
      description: 'Headcount requirements and hiring sequence to support next 12 months of growth',
      owner: 'operations',
    },
  ],
  passCriteria: [
    {
      id: 'mrr_target_achievement',
      description: 'MRR ≥ 80% of target',
      metric: 'mrr_target_achievement_pct',
      minValue: 80,
      required: true,
    },
    {
      id: 'ltv_cac_ratio',
      description: 'LTV/CAC ≥ 3',
      metric: 'ltv_cac_ratio',
      minValue: 3,
      required: true,
    },
    {
      id: 'gross_margin',
      description: 'Gross margin ≥ 60%',
      metric: 'gross_margin_pct',
      minValue: 60,
      required: true,
    },
    {
      id: 'annual_churn_rate',
      description: 'Annual churn rate ≤ 10%',
      metric: 'annual_churn_rate',
      minValue: 0, // lower is better — checked via inverse
      required: false,
    },
    {
      id: 'nrr',
      description: 'Net Revenue Retention ≥ 100%',
      metric: 'nrr',
      minValue: 100,
      required: false,
    },
    {
      id: 'payback_period_months',
      description: 'CAC payback period ≤ 12 months',
      metric: 'payback_period_months',
      minValue: 0, // lower is better — checked via inverse
      required: false,
    },
  ],
  gateLabel: 'Scale Gate — Is the business defensible and ready for next investment?',
};

// ─── Stage Executor ───────────────────────────────────────────────────────────

/**
 * Executes the Scale stage for a given project.
 * Final stage — simulates operations + data + engineering + growth optimizing unit economics.
 * D-6 playbooks integrate here: freemium→premium, PLG, community-led strategies.
 */
export function executeScale(project: Project): StageResult {
  const now = new Date().toISOString();
  const metadata = project.metadata;

  // Carry forward from growth
  const growthResult = project.stageResults['growth'];
  const launchResult = project.stageResults['launch'];
  const growthMrr = growthResult?.metrics['current_mrr'] ?? 0;
  const growthCac = growthResult?.metrics['cac'] ?? 500;
  const growthRetention = growthResult?.metrics['month3_retention'] ?? 72;
  const growthCustomers = growthResult?.metrics['total_customers'] ?? 20;
  const growthRate = growthResult?.metrics['mom_mrr_growth_rate'] ?? 15;

  // Scale stage outcomes
  const momGrowthAtScale = Math.max(8, growthRate - 5); // growth rate moderates at scale
  const finalMrr = Math.round(growthMrr * Math.pow(1 + momGrowthAtScale / 100, 3));
  const mrrTargetAchievementPct = Math.round((finalMrr / metadata.targetMrr) * 100);
  const finalCustomers = Math.round(growthCustomers * 1.5);
  const avgRevenuePerUser = finalMrr / finalCustomers;
  const newCac = Math.round(growthCac * 0.75); // 25% improvement via scale efficiencies
  const grossMarginPct = simulateGrossMargin(metadata.riskLevel);
  const annualChurnRate = simulateAnnualChurn(growthRetention);
  const ltv = avgRevenuePerUser * (1 / (annualChurnRate / 100)) * 12;
  const ltvCacRatio = parseFloat((ltv / newCac).toFixed(2));
  const paybackPeriodMonths = Math.round(newCac / (avgRevenuePerUser * (grossMarginPct / 100)));
  const expansionMrr = growthResult?.metrics['expansion_mrr'] ?? 0;
  const nrr = Math.round(100 + (expansionMrr / finalMrr * 100) - annualChurnRate);
  const integrationsBuilt = 4;
  const moatScore = computeMoatScore(integrationsBuilt, growthRetention, nrr);

  const deliverables: Deliverable[] = SCALE_CONFIG.deliverableTemplates.map(template => {
    let status: Deliverable['status'] = 'done';
    let artifact: string | undefined;

    switch (template.id) {
      case 'unit-economics-report':
        artifact = `CAC: $${newCac} | LTV: $${Math.round(ltv)} | LTV/CAC: ${ltvCacRatio} | Payback: ${paybackPeriodMonths}mo | Gross Margin: ${grossMarginPct}%`;
        break;
      case 'expansion-strategy':
        artifact = `Primary: expand to adjacent teams (${metadata.departments.filter(d => d !== metadata.owner).join(', ')}). Secondary: EU/LATAM market entry. TAM +40% with expansion.`;
        break;
      case 'integrations-ecosystem':
        artifact = `${integrationsBuilt} integrations live: Zapier (1200+ activations), Slack (native), API webhooks, CSV export. Developer ecosystem seeded.`;
        break;
      case 'churn-reduction-playbook':
        artifact = `Health score: usage_frequency*0.4 + feature_breadth*0.3 + support_tickets*0.3. At-risk intervention: email + CSM call. Result: ${Math.round(annualChurnRate * 0.8)}% churn vs ${annualChurnRate}% baseline.`;
        break;
      case 'target-mrr-achieved':
        status = mrrTargetAchievementPct >= 80 ? 'done' : 'in-progress';
        artifact = `MRR: $${finalMrr.toLocaleString()} (${mrrTargetAchievementPct}% of $${metadata.targetMrr.toLocaleString()} target).`;
        break;
      case 'operational-playbooks':
        artifact = `4 runbooks created: onboarding (7-step), escalation (3-tier), billing (Stripe automation), GDPR compliance. 0 manual steps in standard flows.`;
        break;
      case 'competitive-moat-analysis':
        artifact = `Moat score: ${moatScore}/10. Strengths: data lock-in (customer history), integration switching costs. Weakness: no network effects yet.`;
        break;
      case 'team-scaling-plan':
        artifact = `Current: 3 FTEs. 12-month plan: +1 CSM, +1 Sales AE, +1 Engineer. Trigger: MRR > $${Math.round(metadata.targetMrr * 1.2).toLocaleString()}.`;
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
    final_mrr: finalMrr,
    mrr_target_achievement_pct: mrrTargetAchievementPct,
    total_customers: finalCustomers,
    cac: newCac,
    ltv: Math.round(ltv),
    ltv_cac_ratio: ltvCacRatio,
    gross_margin_pct: grossMarginPct,
    annual_churn_rate: annualChurnRate,
    nrr,
    payback_period_months: paybackPeriodMonths,
    moat_score: moatScore,
    integrations_built: integrationsBuilt,
    mom_growth_rate: momGrowthAtScale,
    pass_score: 0,
  };

  // Annual churn and payback period are "lower is better" — adjust evaluation manually
  const baseEvaluation = evaluatePassCriteria(SCALE_CONFIG.passCriteria, {
    stage: 'scale',
    status: 'success',
    deliverables,
    metrics,
    blockers: [],
    next_stage_ready: false,
    summary: '',
    completedAt: now,
    insights: [],
  });

  // Apply manual inversions for min-is-better metrics
  const churnOk = annualChurnRate <= 10;
  const paybackOk = paybackPeriodMonths <= 12;
  const inverseAdjust = [churnOk, paybackOk].filter(b => !b).length * 5;
  const adjustedScore = Math.max(0, baseEvaluation.score - inverseAdjust);
  metrics.pass_score = adjustedScore;

  const blockers: string[] = [];
  if (mrrTargetAchievementPct < 80) {
    blockers.push(`MRR at ${mrrTargetAchievementPct}% of target (need ≥80%)`);
  }
  if (ltvCacRatio < 3) {
    blockers.push(`LTV/CAC ${ltvCacRatio} below 3 threshold`);
  }
  if (grossMarginPct < 60) {
    blockers.push(`Gross margin ${grossMarginPct}% below 60%`);
  }

  const nextStageReady = blockers.length === 0; // scale is the final stage — completion signal

  const { recommendation, rationale } = deriveGateRecommendation(
    { ...baseEvaluation, score: adjustedScore },
    {
      stage: 'scale',
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
    `Final MRR: $${finalMrr.toLocaleString()} (${mrrTargetAchievementPct}% of target). ${finalCustomers} customers.`,
    `Unit economics: LTV/CAC ${ltvCacRatio}, payback ${paybackPeriodMonths}mo, gross margin ${grossMarginPct}%`,
    `NRR: ${nrr}% — ${nrr >= 110 ? 'negative churn (expansion > churn)' : nrr >= 100 ? 'breakeven retention' : 'churn exceeds expansion'}`,
    `Competitive moat: ${moatScore}/10 — ${moatScore >= 7 ? 'defensible' : 'needs strengthening'}`,
    `Recommendation: ${recommendation} — ${rationale}`,
  ];

  const isComplete = blockers.length === 0;

  return {
    stage: 'scale',
    status: blockers.length > 0 ? 'blocked' : 'success',
    deliverables,
    metrics,
    blockers,
    next_stage_ready: nextStageReady, // true = pipeline complete
    summary: `Scale complete. $${finalMrr.toLocaleString()} MRR (${mrrTargetAchievementPct}% of target). LTV/CAC: ${ltvCacRatio}. NRR: ${nrr}%. ${isComplete ? 'Pipeline COMPLETED.' : 'Gate pending.'}`,
    completedAt: now,
    insights,
  };
}

// ─── Simulation Helpers ────────────────────────────────────────────────────────

function simulateGrossMargin(riskLevel: string): number {
  const base: Record<string, number> = { low: 72, medium: 66, high: 58 };
  return base[riskLevel] ?? 66;
}

function simulateAnnualChurn(month3Retention: number): number {
  // Annualized churn estimate from monthly retention proxy
  const monthlyChurnEst = (100 - month3Retention) / 3;
  return Math.round(monthlyChurnEst * 12 * 0.7); // annual is lower than 12x monthly (tapering)
}

function computeMoatScore(integrations: number, retention: number, nrr: number): number {
  const integrationScore = Math.min(4, integrations); // max 4 pts from integrations
  const retentionScore = retention >= 80 ? 3 : retention >= 70 ? 2 : 1;
  const nrrScore = nrr >= 110 ? 3 : nrr >= 100 ? 2 : 1;
  return Math.min(10, integrationScore + retentionScore + nrrScore);
}

// ─── Stage Entry/Exit Hooks ────────────────────────────────────────────────────

export function enterScale(project: Project): void {
  if (project.currentStage !== 'scale') {
    throw new Error(`enterScale: project is in stage '${project.currentStage}', not 'scale'`);
  }
}

export function exitScale(result: StageResult): void {
  if (result.stage !== 'scale') {
    throw new Error(`exitScale: unexpected stage '${result.stage}'`);
  }
  // Scale is the final stage — next_stage_ready=true means pipeline completed
}
