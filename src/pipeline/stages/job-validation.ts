// One Agent Corp — Job & Offer Validation Stage
// Domain D-4 | Stage 0/6: JTBD discovery, offer design, competitive intelligence — runs BEFORE ideation

import type { StageConfig, StageResult, Deliverable, Project } from '../types.js';
import { evaluatePassCriteria, deriveGateRecommendation } from '../gates.js';

// ─── Extended Stage Name ───────────────────────────────────────────────────────
// Note: 'job-validation' is a string literal used in RealPipelineEngine.
// The core StageName union in types.ts covers the 6 standard stages;
// job-validation operates as a pre-pipeline stage (Stage 0).

export type JobValidationStageName = 'job-validation';

// ─── Pass Criteria Data Shape ─────────────────────────────────────────────────

export interface JobValidationPassCriteria {
  jobToBeDone: string;
  targetSegment: string;
  uniqueMechanism: string;
  priceValidated: boolean;
  competitorGap: string;
}

// ─── Stage Configuration ──────────────────────────────────────────────────────

export const JOB_VALIDATION_CONFIG: StageConfig & { name: string } = {
  name: 'job-validation' as string,
  displayName: 'Job & Offer Validation',
  description:
    'Validate the Jobs-to-be-Done, design the offer, and map the competitive gap before any ideation or code. ' +
    'Runs Trends + Offer + Competitive Intelligence departments. Duration: 48 hours.',
  departments: ['trends', 'offer', 'competitive'] as unknown as StageConfig['departments'],
  estimatedDays: 2, // 48 hours
  deliverableTemplates: [
    {
      id: 'jtbd-canvas',
      name: 'JTBD Canvas',
      description:
        'Structured Jobs-to-be-Done map: functional job, emotional job, social job, pain triggers, and desired outcomes for the primary segment.',
      owner: 'product',
    },
    {
      id: 'target-segment-brief',
      name: 'Target Segment Brief',
      description:
        'ICP (Ideal Customer Profile) with demographic, firmographic, and psychographic attributes. Min 50 interviews/data points.',
      owner: 'data',
    },
    {
      id: 'unique-mechanism',
      name: 'Unique Mechanism Doc',
      description:
        'The proprietary or novel mechanism that makes the offer work — the "why it works" behind the promise.',
      owner: 'product',
    },
    {
      id: 'price-validation-report',
      name: 'Price Validation Report',
      description:
        'Van Westendorp or Conjoint price sensitivity analysis. Confirms price point customers will pay.',
      owner: 'data',
    },
    {
      id: 'competitor-gap-analysis',
      name: 'Competitor Gap Analysis',
      description:
        'Feature vs. value gap map: what competitors promise vs. what they fail to deliver. Min 5 competitors.',
      owner: 'data',
    },
    {
      id: 'offer-one-pager',
      name: 'Offer One-Pager',
      description:
        'Draft offer: headline promise, unique mechanism, proof, price, and CTA. Used as input to ideation.',
      owner: 'product',
    },
  ],
  passCriteria: [
    {
      id: 'jtbd-canvas',
      description: 'JTBD Canvas completed with at least 1 primary job defined',
      required: true,
    },
    {
      id: 'target-segment-brief',
      description: 'Target segment defined with validated ICP',
      required: true,
    },
    {
      id: 'unique-mechanism',
      description: 'Unique mechanism articulated (not generic)',
      required: true,
    },
    {
      id: 'price-validation-report',
      description: 'Price point validated (offer_validated = true)',
      metric: 'offer_validated_flag',
      minValue: 1,
      required: true,
    },
    {
      id: 'competitor-gap-analysis',
      description: 'Competitor gap identified with ≥ 5 competitors analyzed',
      metric: 'competitor_count',
      minValue: 5,
      required: true,
    },
    {
      id: 'market-size-floor',
      description: 'Market size ≥ $500K USD (addressable minimum)',
      metric: 'market_size_usd',
      minValue: 500_000,
      required: false,
    },
    {
      id: 'jobs-identified-min',
      description: 'At least 2 distinct JTBD validated',
      metric: 'jobs_identified',
      minValue: 2,
      required: false,
    },
    {
      id: 'offer-one-pager',
      description: 'Offer one-pager drafted',
      required: false,
    },
  ],
  gateLabel: 'Gate 0 — CEO approves the opportunity and the offer before ideation',
};

// ─── Stage Executor ───────────────────────────────────────────────────────────

/**
 * Executes Stage 0 — Job & Offer Validation.
 *
 * Simulates Trends + Offer + Competitive Intelligence department work:
 * JTBD discovery, offer design, price validation, and competitor gap mapping.
 *
 * Returns a StageResult with all deliverables and metrics populated.
 * The StageResult.stage field is cast to satisfy the typed interface while
 * 'job-validation' is not yet in the StageName union (pre-pipeline stage 0).
 */
export function executeJobValidation(project: Project): StageResult {
  const now = new Date().toISOString();
  const metadata = project.metadata;

  // Simulated department outputs
  const jobsIdentified = deriveJobsIdentified(metadata.description);
  const marketSizeUsd = estimateMarketSize(metadata.targetMrr);
  const competitorCount = 7; // Competitive Intelligence always scans ≥7 players
  const pricePointUsd = derivePricePoint(metadata.targetMrr);
  const offerValidated = pricePointUsd > 0 && competitorCount >= 5;

  const deliverables: Deliverable[] = JOB_VALIDATION_CONFIG.deliverableTemplates.map(template => {
    let artifact: string | undefined;

    switch (template.id) {
      case 'jtbd-canvas':
        artifact = [
          `[Trends] Primary JTBD: "${metadata.description.slice(0, 80)}..."`,
          `Functional: automate ${metadata.name.toLowerCase()} workflow`,
          `Emotional: feel in control of ${metadata.name.toLowerCase()} outcomes`,
          `Social: be seen as data-driven decision maker`,
        ].join(' | ');
        break;

      case 'target-segment-brief':
        artifact = [
          `ICP: ${metadata.departments.join(', ')} teams — 5-50 employees`,
          `Pain trigger: manual process taking >4h/week`,
          `Budget authority: VP/Director level`,
          `Decision cycle: <2 weeks`,
        ].join(' | ');
        break;

      case 'unique-mechanism':
        artifact = `[Offer] Unique Mechanism: AI-assisted ${metadata.name} pipeline that reduces manual work by 80% via pre-trained domain heuristics — not generic AI, purpose-built for ${metadata.description.slice(0, 60)}.`;
        break;

      case 'price-validation-report':
        artifact = [
          `[Data] Van Westendorp Analysis — ${pricePointUsd > 0 ? 'VALIDATED' : 'FAILED'}`,
          `Acceptable price range: $${Math.round(pricePointUsd * 0.7)}-$${Math.round(pricePointUsd * 1.4)}/mo`,
          `Validated price point: $${pricePointUsd}/mo`,
          `Price resistance threshold: $${Math.round(pricePointUsd * 2)}/mo`,
        ].join(' | ');
        break;

      case 'competitor-gap-analysis':
        artifact = [
          `[Competitive] ${competitorCount} competitors analyzed`,
          `Primary gap: ${competitorCount >= 5 ? 'No player combines automation + reporting in <5min setup' : 'Gap analysis incomplete'}`,
          `Pricing gap: incumbents are $${Math.round(pricePointUsd * 3)}-$${Math.round(pricePointUsd * 8)}/mo — overbuild for SMB`,
          `UX gap: all require dedicated ops team — opportunity for self-serve`,
        ].join(' | ');
        break;

      case 'offer-one-pager':
        artifact = [
          `[Offer] "${metadata.name} — ${metadata.description.slice(0, 60)}"`,
          `Promise: ${metadata.description.slice(0, 100)} in under 5 minutes`,
          `Mechanism: Pre-trained domain AI, zero configuration`,
          `Proof: Beta results from 12 design partners`,
          `Price: $${pricePointUsd}/mo | CTA: "Start free trial"`,
        ].join(' | ');
        break;

      default:
        break;
    }

    return {
      ...template,
      status: 'done' as const,
      completedAt: now,
      artifact,
    };
  });

  const metrics: Record<string, number> = {
    jobs_identified: jobsIdentified,
    market_size_usd: marketSizeUsd,
    competitor_count: competitorCount,
    offer_validated_flag: offerValidated ? 1 : 0,
    price_point_usd: pricePointUsd,
    jtbd_interviews_conducted: 24,
    design_partners_confirmed: 4,
    pass_score: 0, // set below
  };

  // Evaluate pass criteria
  const stageResultDraft: StageResult = {
    stage: 'ideation', // temporary placeholder to satisfy type — overridden in final return
    status: 'success',
    deliverables,
    metrics,
    blockers: [],
    next_stage_ready: false,
    summary: '',
    completedAt: now,
    insights: [],
  };

  const evaluation = evaluatePassCriteria(JOB_VALIDATION_CONFIG.passCriteria, stageResultDraft);
  metrics.pass_score = evaluation.score;

  const { recommendation, rationale } = deriveGateRecommendation(
    evaluation,
    {
      ...stageResultDraft,
      next_stage_ready: evaluation.failingRequired.length === 0,
    }
  );

  const blockers: string[] = evaluation.failingRequired.map(c => `BLOCKER: ${c.description}`);

  const insights: string[] = [
    `${jobsIdentified} distinct JTBD validated — primary: automate ${metadata.name.toLowerCase()} workflow`,
    `Market size: $${marketSizeUsd.toLocaleString()} USD (addressable) — ${marketSizeUsd >= 1_000_000 ? 'healthy' : 'niche — validate further'}`,
    `${competitorCount} competitors analyzed — gap: self-serve SMB segment underserved`,
    `Price validated at $${pricePointUsd}/mo — incumbent average $${Math.round(pricePointUsd * 4)}/mo (4x opportunity)`,
    `Offer validated: ${offerValidated ? 'YES — proceed to ideation' : 'NO — revisit pricing and mechanism'}`,
    `Gate 0 recommendation: ${recommendation} — ${rationale}`,
  ];

  const nextStageReady = evaluation.failingRequired.length === 0;

  // Cast stage name: 'job-validation' is Stage 0, outside the standard StageName union.
  // RealPipelineEngine handles this stage independently; StageResult.stage is typed as StageName
  // for interface compatibility — consumers of this stage know it's 'job-validation'.
  return {
    stage: 'ideation' as StageResult['stage'], // compatibility shim — RealPipelineEngine overrides
    status: blockers.length > 0 ? 'blocked' : 'success',
    deliverables,
    metrics,
    blockers,
    next_stage_ready: nextStageReady,
    summary: [
      `Job & Offer Validation complete for ${metadata.name}.`,
      `${jobsIdentified} JTBD identified, market ~$${marketSizeUsd.toLocaleString()} USD,`,
      `${competitorCount} competitors mapped, offer ${offerValidated ? 'validated' : 'NOT validated'} at $${pricePointUsd}/mo.`,
      `Pass score: ${evaluation.score}/100.`,
    ].join(' '),
    completedAt: now,
    insights,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deriveJobsIdentified(description: string): number {
  const wordCount = description.trim().split(/\s+/).length;
  if (wordCount >= 20) return 5;
  if (wordCount >= 10) return 3;
  return 2;
}

function estimateMarketSize(targetMrr: number): number {
  // If we can capture 0.1% of SAM, and SAM = 10% of TAM:
  // TAM = targetMrr * 12 / 0.001 / 0.1 => targetMrr * 120,000
  // Floor at $500K, cap at $500M for simulation
  const raw = targetMrr * 12 * 1_000;
  return Math.min(Math.max(raw, 500_000), 500_000_000);
}

function derivePricePoint(targetMrr: number): number {
  // Validated price = average ARPU inferred from targetMrr / expected customer count
  // Assume 30% of targetMrr comes from anchor tier at ~3x base price
  const expectedCustomers = Math.max(10, Math.round(targetMrr / 75));
  const arpu = Math.round(targetMrr / expectedCustomers);
  return Math.max(29, arpu); // floor at $29/mo
}

// ─── Stage Entry/Exit Hooks ────────────────────────────────────────────────────

export function enterJobValidation(project: Project): void {
  const timestamp = new Date().toISOString();
  void timestamp; // available for future messaging integration
  void project;   // project context available for department routing
}

export function exitJobValidation(result: StageResult): void {
  // Validate result before advancing to ideation
  void result; // hook available for future validation logic
}

// ─── Singleton Instance ───────────────────────────────────────────────────────

/**
 * JobValidationStage — class wrapper for use in stage registries and dependency injection.
 */
export class JobValidationStage {
  readonly name: JobValidationStageName = 'job-validation';
  readonly config = JOB_VALIDATION_CONFIG;

  execute(project: Project): StageResult {
    return executeJobValidation(project);
  }

  onEnter(project: Project): void {
    enterJobValidation(project);
  }

  onExit(result: StageResult): void {
    exitJobValidation(result);
  }

  getPassCriteria(): typeof JOB_VALIDATION_CONFIG.passCriteria {
    return JOB_VALIDATION_CONFIG.passCriteria;
  }

  getEstimatedDays(): number {
    return JOB_VALIDATION_CONFIG.estimatedDays;
  }
}

export const jobValidationStage = new JobValidationStage();
