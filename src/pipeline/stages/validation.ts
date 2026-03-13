// One Agent Corp — Validation Stage
// Domain D-5 | Stage 2/6: Customer discovery, problem-solution fit

import type { StageConfig, StageResult, Deliverable, Project } from '../types';
import { evaluatePassCriteria, deriveGateRecommendation } from '../gates';

// ─── Stage Configuration ──────────────────────────────────────────────────────

export const VALIDATION_CONFIG: StageConfig = {
  name: 'validation',
  displayName: 'Customer Discovery & Problem-Solution Fit',
  description:
    'Run customer interviews, validate willingness to pay, achieve problem-solution fit before committing to build.',
  departments: ['product', 'sales', 'data'],
  estimatedDays: 14,
  deliverableTemplates: [
    {
      id: 'interview-log',
      name: 'Customer Interview Log',
      description: 'Minimum 10 structured customer interviews with key insights extracted',
      owner: 'sales',
    },
    {
      id: 'problem-solution-fit',
      name: 'Problem-Solution Fit Report',
      description: 'Evidence that ≥60% of interviewed prospects confirm the problem is painful enough to pay',
      owner: 'product',
    },
    {
      id: 'willingness-to-pay',
      name: 'Willingness-to-Pay Signal',
      description: 'At least 3 prospects expressed willingness to pay (LOI, pre-order, or verbal commitment)',
      owner: 'sales',
    },
    {
      id: 'persona-definition',
      name: 'ICP Persona Definition',
      description: 'Ideal Customer Profile: company size, role, pain trigger, buying process, budget authority',
      owner: 'product',
    },
    {
      id: 'pivot-or-persevere',
      name: 'Pivot-or-Persevere Decision',
      description: 'Data-backed decision: proceed with original hypothesis or pivot based on interview findings',
      owner: 'product',
    },
    {
      id: 'validation-metrics-report',
      name: 'Validation Metrics Report',
      description: 'Quantitative summary: # interviews, pain score, interest score, WTP signal count',
      owner: 'data',
    },
  ],
  passCriteria: [
    {
      id: 'interviews_completed',
      description: '≥ 10 customer interviews completed',
      metric: 'interviews_completed',
      minValue: 10,
      required: true,
    },
    {
      id: 'pain_confirmation_rate',
      description: '≥ 60% of prospects confirm problem is painful (score ≥ 7/10)',
      metric: 'pain_confirmation_rate',
      minValue: 60,
      required: true,
    },
    {
      id: 'wtp_signals',
      description: '≥ 3 prospects with willingness-to-pay signal',
      metric: 'wtp_signals',
      minValue: 3,
      required: true,
    },
    {
      id: 'problem-solution-fit',
      description: 'Problem-solution fit report completed',
      required: true,
    },
    {
      id: 'persona-definition',
      description: 'ICP persona fully defined',
      required: false,
    },
    {
      id: 'churn_risk_score',
      description: 'Churn risk assessed (score ≤ 4/10)',
      metric: 'churn_risk_score',
      minValue: 0,  // This is a max criterion — handled specially
      required: false,
    },
  ],
  gateLabel: 'Validation Gate — Is there real customer demand?',
};

// ─── Stage Executor ───────────────────────────────────────────────────────────

/**
 * Executes the Validation stage for a given project.
 * Simulates product + sales + data: customer interviews, WTP analysis, fit scoring.
 */
export function executeValidation(project: Project): StageResult {
  const now = new Date().toISOString();
  const metadata = project.metadata;

  // Simulate interview outcomes based on project risk profile
  const interviewsCompleted = simulateInterviews(metadata.riskLevel);
  const painConfirmationRate = simulatePainRate(metadata.riskLevel);
  const wtpSignals = simulateWTPSignals(painConfirmationRate, metadata.targetMrr);
  const churnRiskScore = simulateChurnRisk(metadata.riskLevel);
  const interestScore = Math.round(painConfirmationRate * 0.9);

  const deliverables: Deliverable[] = VALIDATION_CONFIG.deliverableTemplates.map(template => {
    let status: Deliverable['status'] = 'done';
    let artifact: string | undefined;

    switch (template.id) {
      case 'interview-log':
        artifact = `${interviewsCompleted} interviews conducted. Top themes: pricing friction, integration pain, onboarding complexity.`;
        break;
      case 'problem-solution-fit':
        artifact = `${painConfirmationRate}% pain confirmation rate. Problem is real. Solution resonates with ${Math.round(painConfirmationRate * 0.7)}% of respondents.`;
        status = painConfirmationRate >= 60 ? 'done' : 'blocked';
        break;
      case 'willingness-to-pay':
        artifact = `${wtpSignals} WTP signals collected. Pricing sensitivity: $${Math.round(metadata.targetMrr / 10)}-$${Math.round(metadata.targetMrr / 5)}/user/month.`;
        status = wtpSignals >= 3 ? 'done' : 'blocked';
        break;
      case 'persona-definition':
        artifact = `ICP: ${metadata.departments.includes('growth') ? 'B2C' : 'B2B'} companies, 10-50 employees, operational pain, $${metadata.budget / 1000}K annual budget.`;
        break;
      case 'pivot-or-persevere':
        artifact = painConfirmationRate >= 60
          ? 'PERSEVERE — strong signal, proceed to MVP with defined ICP'
          : 'PIVOT RECOMMENDED — pain confirmation below threshold, refine positioning';
        break;
      case 'validation-metrics-report':
        artifact = `Interviews: ${interviewsCompleted} | Pain Rate: ${painConfirmationRate}% | WTP: ${wtpSignals} | Interest: ${interestScore}%`;
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
    interviews_completed: interviewsCompleted,
    pain_confirmation_rate: painConfirmationRate,
    wtp_signals: wtpSignals,
    churn_risk_score: churnRiskScore,
    interest_score: interestScore,
    pivot_risk: painConfirmationRate < 60 ? 1 : 0,
    pass_score: 0,
  };

  const evaluation = evaluatePassCriteria(VALIDATION_CONFIG.passCriteria, {
    stage: 'validation',
    status: 'success',
    deliverables,
    metrics,
    blockers: [],
    next_stage_ready: false,
    summary: '',
    completedAt: now,
    insights: [],
  });

  // Churn risk is a "lower is better" metric — manually check
  const churnOk = churnRiskScore <= 4;
  const adjustedScore = churnOk ? evaluation.score : Math.max(0, evaluation.score - 10);
  metrics.pass_score = adjustedScore;

  const blockers: string[] = [];
  if (interviewsCompleted < 10) blockers.push(`Only ${interviewsCompleted} interviews completed (need ≥10)`);
  if (painConfirmationRate < 60) blockers.push(`Pain confirmation ${painConfirmationRate}% below 60% threshold`);
  if (wtpSignals < 3) blockers.push(`Only ${wtpSignals} WTP signals (need ≥3)`);

  const nextStageReady = blockers.length === 0;

  const { recommendation, rationale } = deriveGateRecommendation(
    { ...evaluation, score: adjustedScore },
    {
      stage: 'validation',
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
    `${painConfirmationRate}% of prospects confirmed the problem — ${painConfirmationRate >= 60 ? 'strong signal' : 'weak signal — revisit positioning'}`,
    `${wtpSignals} WTP signals — pricing power ${wtpSignals >= 5 ? 'strong' : 'moderate'}`,
    `Churn risk score: ${churnRiskScore}/10 — ${churnRiskScore <= 3 ? 'low' : churnRiskScore <= 6 ? 'medium' : 'high'}`,
    `Recommendation: ${recommendation} — ${rationale}`,
  ];

  return {
    stage: 'validation',
    status: blockers.length > 0 ? 'blocked' : 'success',
    deliverables,
    metrics,
    blockers,
    next_stage_ready: nextStageReady,
    summary: `Validation complete. ${interviewsCompleted} interviews, ${painConfirmationRate}% pain confirmation, ${wtpSignals} WTP signals.`,
    completedAt: now,
    insights,
  };
}

// ─── Simulation Helpers ────────────────────────────────────────────────────────

function simulateInterviews(riskLevel: string): number {
  const base: Record<string, number> = { low: 15, medium: 12, high: 10 };
  return base[riskLevel] ?? 12;
}

function simulatePainRate(riskLevel: string): number {
  const base: Record<string, number> = { low: 75, medium: 65, high: 55 };
  return base[riskLevel] ?? 65;
}

function simulateWTPSignals(painRate: number, targetMrr: number): number {
  // Higher pain rate + lower price point = more WTP signals
  const base = Math.floor(painRate / 20);
  const priceAdjust = targetMrr < 500 ? 2 : targetMrr < 2000 ? 1 : 0;
  return Math.max(0, base + priceAdjust);
}

function simulateChurnRisk(riskLevel: string): number {
  const base: Record<string, number> = { low: 2, medium: 4, high: 6 };
  return base[riskLevel] ?? 4;
}

// ─── Stage Entry/Exit Hooks ────────────────────────────────────────────────────

export function enterValidation(project: Project): void {
  if (project.currentStage !== 'validation') {
    throw new Error(`enterValidation: project is in stage '${project.currentStage}', not 'validation'`);
  }
}

export function exitValidation(result: StageResult): void {
  if (result.stage !== 'validation') {
    throw new Error(`exitValidation: unexpected stage '${result.stage}'`);
  }
}
