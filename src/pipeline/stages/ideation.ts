// One Agent Corp — Ideation Stage
// Domain D-5 | Stage 1/6: Brainstorm, validate ideas, market research

import type { DepartmentId } from '../../types/organization';
import type { StageConfig, StageResult, Deliverable, Project } from '../types';
import { evaluatePassCriteria, deriveGateRecommendation } from '../gates';

// ─── Stage Configuration ──────────────────────────────────────────────────────

export const IDEATION_CONFIG: StageConfig = {
  name: 'ideation',
  displayName: 'Ideation & Market Research',
  description:
    'Brainstorm micro-SaaS ideas, validate market demand, assess competitive landscape, and define the problem worth solving.',
  departments: ['product', 'data'],
  estimatedDays: 7,
  deliverableTemplates: [
    {
      id: 'idea-brief',
      name: 'Idea Brief',
      description: '1-page structured document: problem, target audience, unique angle, initial hypothesis',
      owner: 'product',
    },
    {
      id: 'market-size-estimate',
      name: 'Market Size Estimate (TAM/SAM/SOM)',
      description: 'Top-down and bottom-up estimates for Total/Serviceable/Obtainable market',
      owner: 'data',
    },
    {
      id: 'competitor-matrix',
      name: 'Competitor Matrix',
      description: 'At least 5 competitors mapped across: price, features, target segment, weaknesses',
      owner: 'data',
    },
    {
      id: 'problem-statement',
      name: 'Problem Statement',
      description: 'Crisp 2-sentence problem statement validated by at least 3 data points',
      owner: 'product',
    },
    {
      id: 'initial-hypothesis',
      name: 'Initial Hypothesis',
      description: 'Falsifiable hypothesis: "We believe [target segment] will pay [price] to solve [problem]"',
      owner: 'product',
    },
  ],
  passCriteria: [
    {
      id: 'idea-brief',
      description: 'Idea brief completed',
      required: true,
    },
    {
      id: 'market-size-estimate',
      description: 'Market size estimated (TAM ≥ $1M)',
      metric: 'tam_usd_thousands',
      minValue: 1_000,  // $1M minimum TAM (in thousands)
      required: true,
    },
    {
      id: 'competitor-matrix',
      description: 'Competitor matrix with ≥ 3 competitors',
      metric: 'competitors_analyzed',
      minValue: 3,
      required: true,
    },
    {
      id: 'problem-statement',
      description: 'Problem statement validated',
      required: true,
    },
    {
      id: 'initial-hypothesis',
      description: 'Falsifiable hypothesis defined',
      required: false,
    },
    {
      id: 'differentiation-score',
      description: 'Clear differentiation angle (score ≥ 6/10)',
      metric: 'differentiation_score',
      minValue: 6,
      required: false,
    },
  ],
  gateLabel: 'Ideation Gate — Is the idea worth validating?',
};

// ─── Stage Executor ───────────────────────────────────────────────────────────

/**
 * Executes the Ideation stage for a given project.
 * Simulates product + data department work: ideation, market sizing, competitor analysis.
 * Returns a StageResult with all deliverables and metrics populated.
 */
export function executeIdeation(project: Project): StageResult {
  const now = new Date().toISOString();
  const metadata = project.metadata;

  // Simulate department work outputs based on project metadata
  const tamEstimate = estimateTAM(metadata.targetMrr);
  const competitorsAnalyzed = 5; // Product team always surveys ≥5 competitors
  const differentiationScore = scoreDifferentiation(metadata.strategicAlignment);

  const deliverables: Deliverable[] = IDEATION_CONFIG.deliverableTemplates.map(template => {
    let status: Deliverable['status'] = 'done';
    let artifact: string | undefined;

    switch (template.id) {
      case 'idea-brief':
        artifact = `[Product] ${metadata.name}: ${metadata.description.slice(0, 120)}...`;
        break;
      case 'market-size-estimate':
        artifact = `TAM: $${(tamEstimate).toLocaleString()}K | SAM: $${Math.round(tamEstimate * 0.1).toLocaleString()}K | SOM: $${Math.round(tamEstimate * 0.01).toLocaleString()}K`;
        break;
      case 'competitor-matrix':
        artifact = `${competitorsAnalyzed} competitors analyzed. Key gap identified: pricing + DX.`;
        break;
      case 'problem-statement':
        artifact = `Target ${metadata.departments.join('/')} teams need to ${metadata.description.slice(0, 80)} — current solutions are too complex.`;
        break;
      case 'initial-hypothesis':
        artifact = `We believe early-stage SaaS teams will pay $${Math.round(metadata.targetMrr / 10)}/mo to solve: ${metadata.description.slice(0, 60)}.`;
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
    tam_usd_thousands: tamEstimate,
    competitors_analyzed: competitorsAnalyzed,
    differentiation_score: differentiationScore,
    ideas_generated: 8,
    ideas_shortlisted: 3,
    ideas_selected: 1,
    market_research_sources: 12,
    pass_score: 0, // will be set below
  };

  const evaluation = evaluatePassCriteria(IDEATION_CONFIG.passCriteria, {
    stage: 'ideation',
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

  const { recommendation, rationale } = deriveGateRecommendation(evaluation, {
    stage: 'ideation',
    status: 'success',
    deliverables,
    metrics,
    blockers: [],
    next_stage_ready: evaluation.failingRequired.length === 0,
    summary: '',
    completedAt: now,
    insights: [],
  });

  const blockers: string[] = evaluation.failingRequired.map(c => `BLOCKER: ${c.description}`);

  const insights: string[] = [
    `TAM estimated at $${tamEstimate.toLocaleString()}K — ${tamEstimate >= 10_000 ? 'healthy market size' : 'niche market — validate carefully'}`,
    `${competitorsAnalyzed} competitors surveyed — differentiation score: ${differentiationScore}/10`,
    `Recommendation: ${recommendation} — ${rationale}`,
  ];

  const nextStageReady = evaluation.failingRequired.length === 0 && deliverables.every(d => d.status === 'done' || !isRequired(d.id));

  return {
    stage: 'ideation',
    status: blockers.length > 0 ? 'blocked' : 'success',
    deliverables,
    metrics,
    blockers,
    next_stage_ready: nextStageReady,
    summary: `Ideation complete. ${metadata.name} — market ~$${tamEstimate.toLocaleString()}K TAM, ${competitorsAnalyzed} competitors mapped, differentiation score ${differentiationScore}/10.`,
    completedAt: now,
    insights,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function estimateTAM(targetMrr: number): number {
  // Rough market sizing: if we capture 1% of SAM, and SAM is 10% of TAM
  // => TAM = targetMrr * 12 * 1000 (annualized, then expand for full market)
  return Math.round((targetMrr * 12 * 1_000) / 1_000); // in USD thousands
}

function scoreDifferentiation(strategicAlignment: string): number {
  // Heuristic: longer, more specific alignment = better differentiation
  const words = strategicAlignment.trim().split(/\s+/).length;
  if (words >= 20) return 9;
  if (words >= 10) return 7;
  if (words >= 5) return 5;
  return 3;
}

function isRequired(deliverableId: string): boolean {
  const requiredIds = ['idea-brief', 'market-size-estimate', 'competitor-matrix', 'problem-statement'];
  return requiredIds.includes(deliverableId);
}

// ─── Stage Entry/Exit Hooks ────────────────────────────────────────────────────

export function enterIdeation(project: Project): void {
  // Log stage entry — in production this would emit a message to operations
  const timestamp = new Date().toISOString();
  void timestamp; // available for future messaging integration
}

export function exitIdeation(result: StageResult): void {
  // Validate result before exiting stage
  if (result.stage !== 'ideation') {
    throw new Error(`exitIdeation: unexpected stage '${result.stage}'`);
  }
}

// ─── Singleton Instance ────────────────────────────────────────────────────────

export const ideationStage = {
  name: 'ideation' as const,
  config: IDEATION_CONFIG,
  execute: executeIdeation,
  onEnter: enterIdeation,
  onExit: exitIdeation,
} as const;
