// One Agent Corp — MVP Stage
// Domain D-5 | Stage 3/6: Build MVP, acquire beta users, measure core metrics

import type { StageConfig, StageResult, Deliverable, Project } from '../types';
import { evaluatePassCriteria, deriveGateRecommendation } from '../gates';

// ─── Stage Configuration ──────────────────────────────────────────────────────

export const MVP_CONFIG: StageConfig = {
  name: 'mvp',
  displayName: 'MVP Build & Beta',
  description:
    'Build minimum viable product with core value prop, onboard beta users, measure activation and retention before full launch.',
  departments: ['engineering', 'product', 'data'],
  estimatedDays: 30,
  deliverableTemplates: [
    {
      id: 'mvp-spec',
      name: 'MVP Specification',
      description: 'Feature list scoped to core value prop only — no gold-plating. Engineering-approved estimate.',
      owner: 'product',
    },
    {
      id: 'mvp-build',
      name: 'Working MVP',
      description: 'Deployed, functional product handling the primary use case end-to-end',
      owner: 'engineering',
    },
    {
      id: 'beta-signup-page',
      name: 'Beta Landing Page',
      description: 'Landing page with value prop, beta signup form, and tracking pixel installed',
      owner: 'engineering',
    },
    {
      id: 'beta-users-onboarded',
      name: 'Beta Users Onboarded',
      description: '≥20 beta users actively using the product and providing feedback',
      owner: 'product',
    },
    {
      id: 'activation-funnel',
      name: 'Activation Funnel Analysis',
      description: 'Step-by-step funnel from signup to first value moment, with drop-off rates identified',
      owner: 'data',
    },
    {
      id: 'feedback-synthesis',
      name: 'Beta Feedback Synthesis',
      description: 'Aggregated qualitative and quantitative feedback from beta cohort with prioritized action items',
      owner: 'product',
    },
    {
      id: 'technical-debt-log',
      name: 'Technical Debt Log',
      description: 'Known shortcuts, limitations, and post-MVP technical work backlog',
      owner: 'engineering',
    },
  ],
  passCriteria: [
    {
      id: 'mvp-build',
      description: 'Working MVP deployed and accessible',
      required: true,
    },
    {
      id: 'beta_users_count',
      description: '≥ 20 beta users onboarded',
      metric: 'beta_users_count',
      minValue: 20,
      required: true,
    },
    {
      id: 'activation_rate',
      description: '≥ 40% activation rate (users reaching first value moment)',
      metric: 'activation_rate',
      minValue: 40,
      required: true,
    },
    {
      id: 'week1_retention',
      description: '≥ 30% week-1 retention',
      metric: 'week1_retention',
      minValue: 30,
      required: true,
    },
    {
      id: 'feedback-synthesis',
      description: 'Beta feedback synthesized and top-3 issues identified',
      required: false,
    },
    {
      id: 'nps_score',
      description: 'Beta NPS ≥ 30',
      metric: 'nps_score',
      minValue: 30,
      required: false,
    },
  ],
  gateLabel: 'MVP Gate — Does the product deliver value? Is it ready to launch?',
};

// ─── Stage Executor ───────────────────────────────────────────────────────────

/**
 * Executes the MVP stage for a given project.
 * Simulates engineering build + product beta + data measurement.
 */
export function executeMVP(project: Project): StageResult {
  const now = new Date().toISOString();
  const metadata = project.metadata;

  // Simulate build and beta metrics based on budget and risk
  const buildSuccess = metadata.budget >= 5_000; // minimum viable engineering budget
  const betaUsersCount = simulateBetaUsers(metadata.riskLevel, metadata.budget);
  const activationRate = simulateActivationRate(metadata.riskLevel);
  const week1Retention = simulateRetention(activationRate);
  const npsScore = simulateNPS(activationRate, week1Retention);
  const bugCount = simulateBugs(metadata.riskLevel);
  const buildVelocityDays = simulateBuildDays(metadata.budget, metadata.riskLevel);

  const deliverables: Deliverable[] = MVP_CONFIG.deliverableTemplates.map(template => {
    let status: Deliverable['status'] = 'done';
    let artifact: string | undefined;

    switch (template.id) {
      case 'mvp-spec':
        artifact = `${metadata.name} MVP: 3 core features. Estimated ${buildVelocityDays} days engineering. No gold-plating.`;
        break;
      case 'mvp-build':
        status = buildSuccess ? 'done' : 'blocked';
        artifact = buildSuccess
          ? `${metadata.name} v0.1 deployed. Core flow functional. ${bugCount} known bugs logged.`
          : `Build blocked — insufficient engineering budget ($${metadata.budget} < $5,000 minimum)`;
        break;
      case 'beta-signup-page':
        artifact = `${metadata.name} beta landing page live. CTA: "Join beta". Conversion pixel installed.`;
        break;
      case 'beta-users-onboarded':
        status = betaUsersCount >= 20 ? 'done' : 'in-progress';
        artifact = `${betaUsersCount} beta users onboarded. Primary segment: ${metadata.departments.includes('growth') ? 'B2C consumers' : 'B2B practitioners'}.`;
        break;
      case 'activation-funnel':
        artifact = `Signup→Activation: ${activationRate}%. Key drop-off: step 2 (configuration). Fix: simplify onboarding.`;
        break;
      case 'feedback-synthesis':
        artifact = `Top issues: (1) onboarding too long, (2) missing ${metadata.name}-specific feature, (3) export formats. NPS: ${npsScore}.`;
        break;
      case 'technical-debt-log':
        artifact = `${bugCount} bugs. Tech debt: no rate limiting, single DB instance, manual deploys. Priority: post-launch stabilization.`;
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
    beta_users_count: betaUsersCount,
    activation_rate: activationRate,
    week1_retention: week1Retention,
    nps_score: npsScore,
    bug_count: bugCount,
    build_days: buildVelocityDays,
    feature_count: 3,
    budget_used_pct: Math.round((buildVelocityDays * 500 / metadata.budget) * 100),
    pass_score: 0,
  };

  const evaluation = evaluatePassCriteria(MVP_CONFIG.passCriteria, {
    stage: 'mvp',
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
  if (!buildSuccess) blockers.push(`MVP build blocked — insufficient budget ($${metadata.budget})`);
  if (betaUsersCount < 20) blockers.push(`Beta users: ${betaUsersCount} (need ≥20)`);
  if (activationRate < 40) blockers.push(`Activation rate: ${activationRate}% (need ≥40%)`);
  if (week1Retention < 30) blockers.push(`Week-1 retention: ${week1Retention}% (need ≥30%)`);

  const nextStageReady = blockers.length === 0;

  const { recommendation, rationale } = deriveGateRecommendation(
    evaluation,
    {
      stage: 'mvp',
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
    `Activation: ${activationRate}% — ${activationRate >= 50 ? 'excellent' : activationRate >= 40 ? 'acceptable' : 'needs work'}`,
    `Week-1 retention: ${week1Retention}% — ${week1Retention >= 40 ? 'strong' : 'risky for launch'}`,
    `NPS: ${npsScore} — ${npsScore >= 50 ? 'promoter majority' : npsScore >= 30 ? 'healthy' : 'needs improvement'}`,
    `Build took ${buildVelocityDays} days. ${bugCount} bugs logged.`,
    `Recommendation: ${recommendation} — ${rationale}`,
  ];

  return {
    stage: 'mvp',
    status: blockers.length > 0 ? 'blocked' : 'success',
    deliverables,
    metrics,
    blockers,
    next_stage_ready: nextStageReady,
    summary: `MVP built and beta tested. ${betaUsersCount} users, ${activationRate}% activation, ${week1Retention}% week-1 retention, NPS ${npsScore}.`,
    completedAt: now,
    insights,
  };
}

// ─── Simulation Helpers ────────────────────────────────────────────────────────

function simulateBetaUsers(riskLevel: string, budget: number): number {
  const base: Record<string, number> = { low: 35, medium: 25, high: 18 };
  const budgetBonus = budget >= 20_000 ? 10 : 0;
  return (base[riskLevel] ?? 25) + budgetBonus;
}

function simulateActivationRate(riskLevel: string): number {
  const base: Record<string, number> = { low: 58, medium: 47, high: 38 };
  return base[riskLevel] ?? 47;
}

function simulateRetention(activationRate: number): number {
  return Math.round(activationRate * 0.65);
}

function simulateNPS(activationRate: number, retention: number): number {
  return Math.round((activationRate + retention) / 2) - 10;
}

function simulateBugs(riskLevel: string): number {
  const base: Record<string, number> = { low: 5, medium: 12, high: 22 };
  return base[riskLevel] ?? 12;
}

function simulateBuildDays(budget: number, riskLevel: string): number {
  const base: Record<string, number> = { low: 18, medium: 25, high: 32 };
  const days = base[riskLevel] ?? 25;
  return budget >= 20_000 ? Math.round(days * 0.8) : days;
}

// ─── Stage Entry/Exit Hooks ────────────────────────────────────────────────────

export function enterMVP(project: Project): void {
  if (project.currentStage !== 'mvp') {
    throw new Error(`enterMVP: project is in stage '${project.currentStage}', not 'mvp'`);
  }
}

export function exitMVP(result: StageResult): void {
  if (result.stage !== 'mvp') {
    throw new Error(`exitMVP: unexpected stage '${result.stage}'`);
  }
}
