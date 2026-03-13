// One Agent Corp — Launch Stage
// Domain D-5 | Stage 4/6: Go-to-market, pricing, public launch

import type { StageConfig, StageResult, Deliverable, Project } from '../types';
import { evaluatePassCriteria, deriveGateRecommendation } from '../gates';

// ─── Stage Configuration ──────────────────────────────────────────────────────

export const LAUNCH_CONFIG: StageConfig = {
  name: 'launch',
  displayName: 'Go-to-Market & Public Launch',
  description:
    'Execute go-to-market strategy, finalize pricing, launch publicly, and acquire first paying customers.',
  departments: ['growth', 'sales', 'product', 'data'],
  estimatedDays: 21,
  deliverableTemplates: [
    {
      id: 'gtm-plan',
      name: 'Go-to-Market Plan',
      description: 'Channels, messaging, target segments, launch sequence, and success metrics',
      owner: 'growth',
    },
    {
      id: 'pricing-model',
      name: 'Pricing Model',
      description: 'Final pricing tiers, free trial or freemium strategy, expansion revenue path',
      owner: 'product',
    },
    {
      id: 'launch-campaign',
      name: 'Launch Campaign',
      description: 'Email, social, and press campaign. ProductHunt/AppSumo/HN launch if applicable.',
      owner: 'growth',
    },
    {
      id: 'sales-playbook',
      name: 'Sales Playbook',
      description: 'Talk track, objection handling, demo script, and closing sequence',
      owner: 'sales',
    },
    {
      id: 'first-paying-customers',
      name: 'First Paying Customers',
      description: '≥5 paying customers (MRR > $0) acquired within launch window',
      owner: 'sales',
    },
    {
      id: 'launch-metrics-report',
      name: 'Launch Metrics Report',
      description: 'Day-7 and Day-30 metrics: signups, activations, conversions, churn, MRR',
      owner: 'data',
    },
    {
      id: 'customer-success-setup',
      name: 'Customer Success Setup',
      description: 'Onboarding emails, documentation, support channel, and SLA defined',
      owner: 'product',
    },
  ],
  passCriteria: [
    {
      id: 'first_paying_customers',
      description: '≥ 5 paying customers',
      metric: 'first_paying_customers',
      minValue: 5,
      required: true,
    },
    {
      id: 'launch_mrr',
      description: 'Launch MRR > $0 (revenue validated)',
      metric: 'launch_mrr',
      minValue: 1,
      required: true,
    },
    {
      id: 'trial_to_paid_rate',
      description: '≥ 10% trial-to-paid conversion rate',
      metric: 'trial_to_paid_rate',
      minValue: 10,
      required: true,
    },
    {
      id: 'gtm-plan',
      description: 'GTM plan executed',
      required: true,
    },
    {
      id: 'day30_retention',
      description: '≥ 60% day-30 retention (paying customers)',
      metric: 'day30_retention',
      minValue: 60,
      required: false,
    },
    {
      id: 'cac',
      description: 'CAC calculated and ≤ 12x MRR (LTV/CAC ≥ 3)',
      metric: 'cac',
      minValue: 0,
      required: false,
    },
  ],
  gateLabel: 'Launch Gate — Is product-market fit emerging? Is the revenue engine real?',
};

// ─── Stage Executor ───────────────────────────────────────────────────────────

/**
 * Executes the Launch stage for a given project.
 * Simulates growth + sales + product: GTM execution, first paying customers, MRR.
 */
export function executeLaunch(project: Project): StageResult {
  const now = new Date().toISOString();
  const metadata = project.metadata;

  // Simulate launch outcomes from prior stage carryover
  const priorValidation = project.stageResults['validation'];
  const priorMVP = project.stageResults['mvp'];
  const validationSignal = priorValidation?.metrics['pain_confirmation_rate'] ?? 65;
  const mvpActivation = priorMVP?.metrics['activation_rate'] ?? 47;

  const signups = simulateSignups(metadata.riskLevel, metadata.budget);
  const trialToPaidRate = simulateTrialToPaid(validationSignal, mvpActivation);
  const firstPayingCustomers = Math.max(0, Math.floor(signups * (trialToPaidRate / 100)));
  const launchMrr = firstPayingCustomers * Math.round(metadata.targetMrr / 20);
  const day30Retention = simulateDay30Retention(mvpActivation);
  const cac = simulateCAC(metadata.budget, firstPayingCustomers);

  const deliverables: Deliverable[] = LAUNCH_CONFIG.deliverableTemplates.map(template => {
    let status: Deliverable['status'] = 'done';
    let artifact: string | undefined;

    switch (template.id) {
      case 'gtm-plan':
        artifact = `Channels: email (primary), content, referral. Target: ${metadata.departments.join(', ')} teams. Launch date: T+0.`;
        break;
      case 'pricing-model':
        artifact = `Free trial 14 days. Starter: $${Math.round(metadata.targetMrr / 20)}/mo. Pro: $${Math.round(metadata.targetMrr / 10)}/mo. Annual: 20% discount.`;
        break;
      case 'launch-campaign':
        artifact = `Email to ${Math.round(signups * 3)} prospects. ProductHunt launch queued. HN "Show HN" draft ready. ${signups} signups generated.`;
        break;
      case 'sales-playbook':
        artifact = `Talk track: demo-first, pain-led. Objections: price (offer annual), features (roadmap). Close: time-limited trial.`;
        break;
      case 'first-paying-customers':
        status = firstPayingCustomers >= 5 ? 'done' : 'blocked';
        artifact = `${firstPayingCustomers} paying customers. MRR: $${launchMrr.toLocaleString()}.`;
        break;
      case 'launch-metrics-report':
        artifact = `Signups: ${signups} | Trials: ${Math.round(signups * 0.6)} | Paid: ${firstPayingCustomers} | MRR: $${launchMrr} | D30 Retention: ${day30Retention}%`;
        break;
      case 'customer-success-setup':
        artifact = `3 onboarding emails. Help docs: 12 articles. Support: Intercom. SLA: 24h response.`;
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
    signups,
    first_paying_customers: firstPayingCustomers,
    launch_mrr: launchMrr,
    trial_to_paid_rate: trialToPaidRate,
    day30_retention: day30Retention,
    cac,
    ltv_cac_ratio: cac > 0 ? parseFloat(((launchMrr * 12 * 3) / cac).toFixed(2)) : 0,
    churn_rate: Math.round(100 - day30Retention),
    pass_score: 0,
  };

  const evaluation = evaluatePassCriteria(LAUNCH_CONFIG.passCriteria, {
    stage: 'launch',
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
  if (firstPayingCustomers < 5) blockers.push(`Only ${firstPayingCustomers} paying customers (need ≥5)`);
  if (launchMrr < 1) blockers.push('No revenue yet — conversion pipeline needs work');
  if (trialToPaidRate < 10) blockers.push(`Trial-to-paid rate ${trialToPaidRate}% below 10% threshold`);

  const nextStageReady = blockers.length === 0;

  const { recommendation, rationale } = deriveGateRecommendation(
    evaluation,
    {
      stage: 'launch',
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
    `${signups} signups → ${firstPayingCustomers} paying (${trialToPaidRate}% trial-to-paid)`,
    `Launch MRR: $${launchMrr.toLocaleString()} (${Math.round((launchMrr / metadata.targetMrr) * 100)}% of target)`,
    `LTV/CAC: ${metrics.ltv_cac_ratio} — ${metrics.ltv_cac_ratio >= 3 ? 'healthy unit economics' : 'needs improvement'}`,
    `Day-30 retention: ${day30Retention}%`,
    `Recommendation: ${recommendation} — ${rationale}`,
  ];

  return {
    stage: 'launch',
    status: blockers.length > 0 ? 'blocked' : 'success',
    deliverables,
    metrics,
    blockers,
    next_stage_ready: nextStageReady,
    summary: `Launch complete. ${signups} signups, ${firstPayingCustomers} paying customers, $${launchMrr.toLocaleString()} MRR.`,
    completedAt: now,
    insights,
  };
}

// ─── Simulation Helpers ────────────────────────────────────────────────────────

function simulateSignups(riskLevel: string, budget: number): number {
  const base: Record<string, number> = { low: 120, medium: 80, high: 50 };
  const budgetBonus = budget >= 30_000 ? 50 : budget >= 15_000 ? 20 : 0;
  return (base[riskLevel] ?? 80) + budgetBonus;
}

function simulateTrialToPaid(validationSignal: number, activationRate: number): number {
  return Math.round((validationSignal * 0.1) + (activationRate * 0.1));
}

function simulateDay30Retention(activationRate: number): number {
  return Math.round(activationRate * 1.3);
}

function simulateCAC(budget: number, customers: number): number {
  if (customers === 0) return 0;
  const marketingBudget = budget * 0.2; // assume 20% of budget goes to acquisition
  return Math.round(marketingBudget / customers);
}

// ─── Stage Entry/Exit Hooks ────────────────────────────────────────────────────

export function enterLaunch(project: Project): void {
  if (project.currentStage !== 'launch') {
    throw new Error(`enterLaunch: project is in stage '${project.currentStage}', not 'launch'`);
  }
}

export function exitLaunch(result: StageResult): void {
  if (result.stage !== 'launch') {
    throw new Error(`exitLaunch: unexpected stage '${result.stage}'`);
  }
}
