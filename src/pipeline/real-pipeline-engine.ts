// One Agent Corp — Real Pipeline Engine
// Domain D-4: Extended 7-stage pipeline with Stage 0 (Job & Offer Validation) prepended

import type { Project, ProjectMetadata, StageResult, Gate, GateResult } from './types.js';
import { PipelineEngine, getPipelineEngine } from './pipeline-engine.js';
import {
  JobValidationStage,
  jobValidationStage,
  executeJobValidation,
  enterJobValidation,
  exitJobValidation,
  JOB_VALIDATION_CONFIG,
} from './stages/job-validation.js';
import type { MessageRouter } from '../messaging/router.js';
import { getGlobalRouter } from '../messaging/router.js';

// ─── Extended Stage Order ─────────────────────────────────────────────────────

/**
 * Full 7-stage pipeline order including Stage 0.
 * Stage 0 (job-validation) runs before ideation and requires CEO Gate 0 approval.
 */
export const REAL_STAGE_ORDER = [
  'job-validation',
  'ideation',
  'validation',
  'mvp',
  'launch',
  'growth',
  'scale',
] as const;

export type RealStageName = (typeof REAL_STAGE_ORDER)[number];

// ─── Stage Progress Result ────────────────────────────────────────────────────

export interface StageProgress {
  stage: RealStageName;
  percentage: number;       // 0-100: how far through the 7-stage pipeline
  estimatedDays: number;    // remaining days from current stage to end
  completedStages: number;  // count of stages already done
  totalStages: number;      // always 7
}

// ─── Stage Duration Map ───────────────────────────────────────────────────────

const STAGE_ESTIMATED_DAYS: Record<RealStageName, number> = {
  'job-validation': 2,
  ideation: 7,
  validation: 14,
  mvp: 21,
  launch: 7,
  growth: 30,
  scale: 30,
};

const TOTAL_PIPELINE_DAYS = Object.values(STAGE_ESTIMATED_DAYS).reduce((a, b) => a + b, 0);

// ─── Real Pipeline Engine ─────────────────────────────────────────────────────

/**
 * RealPipelineEngine extends PipelineEngine with Stage 0 support.
 *
 * Stages 1-6 delegate to the underlying PipelineEngine.
 * Stage 0 (job-validation) is handled directly by this engine before the
 * project enters the standard pipeline.
 *
 * Stage 0 results are stored in project.metadata context via a side-channel
 * map keyed by projectId, since the core Project type's stageResults is typed
 * as Partial<Record<StageName, StageResult>> and does not include 'job-validation'.
 */
export class RealPipelineEngine {
  private readonly inner: PipelineEngine;
  private readonly router: MessageRouter;

  // Side-channel store for Stage 0 results (not tracked in core Project type)
  private readonly jobValidationResults = new Map<string, StageResult>();
  private readonly jobValidationStatus = new Map<
    string,
    'pending' | 'in-progress' | 'awaiting-gate' | 'approved' | 'skipped'
  >();

  constructor(router?: MessageRouter, innerEngine?: PipelineEngine) {
    this.router = router ?? getGlobalRouter();
    this.inner = innerEngine ?? getPipelineEngine(this.router);
  }

  // ── Stage 0: Job & Offer Validation ───────────────────────────────────────

  /**
   * Runs Stage 0 (Job & Offer Validation) for a project.
   * Must be called before startProject() on the inner engine.
   *
   * Real execution note: when D-2 (department agents) and D-3 (orchestrator) are wired,
   * this will dispatch to Trends, Offer, and Competitive Intelligence departments.
   * For now, execution is stubbed via the JobValidationStage executor.
   */
  async executeStage0(projectId: string): Promise<StageResult> {
    const project = this.inner.getProject(projectId);
    if (!project) {
      throw new Error(`RealPipelineEngine.executeStage0: project '${projectId}' not found`);
    }

    const existingStatus = this.jobValidationStatus.get(projectId) ?? 'pending';
    if (existingStatus === 'approved') {
      throw new Error(
        `RealPipelineEngine.executeStage0: Stage 0 already approved for project '${projectId}'`
      );
    }

    console.log(
      `[RealPipelineEngine] Stage 0 executing for project '${projectId}' — ` +
      `departments: ${JOB_VALIDATION_CONFIG.departments.join(', ')} — ` +
      `estimated: ${JOB_VALIDATION_CONFIG.estimatedDays * 24}h`
    );
    console.log(
      `[RealPipelineEngine] NOTE: real department execution (D-2/D-3) will be wired in a future sprint. ` +
      `Running stub executor.`
    );

    this.jobValidationStatus.set(projectId, 'in-progress');
    enterJobValidation(project);

    // Stub execution — real departments will be called here when D-2 and D-3 are complete
    const result = await Promise.resolve(executeJobValidation(project));

    exitJobValidation(result);
    this.jobValidationResults.set(projectId, result);
    this.jobValidationStatus.set(projectId, 'awaiting-gate');

    console.log(
      `[RealPipelineEngine] Stage 0 complete for '${projectId}'. ` +
      `pass_score=${result.metrics['pass_score']} | offer_validated=${result.metrics['offer_validated_flag'] === 1} | ` +
      `next_stage_ready=${result.next_stage_ready}`
    );

    return result;
  }

  /**
   * Approves Gate 0 and allows the project to enter Stage 1 (ideation).
   * After Gate 0 approval, call startProject() to begin the standard pipeline.
   */
  approveGate0(
    projectId: string,
    opts?: { reason?: string; conditions?: string[] }
  ): { projectId: string; approved: boolean; reason: string } {
    const stage0Result = this.jobValidationResults.get(projectId);
    if (!stage0Result) {
      throw new Error(
        `RealPipelineEngine.approveGate0: Stage 0 has not been executed for project '${projectId}'`
      );
    }

    const status = this.jobValidationStatus.get(projectId);
    if (status !== 'awaiting-gate') {
      throw new Error(
        `RealPipelineEngine.approveGate0: expected status 'awaiting-gate', got '${status}' for project '${projectId}'`
      );
    }

    const reason = opts?.reason ?? `CEO approved Gate 0 for project '${projectId}'`;

    this.jobValidationStatus.set(projectId, 'approved');

    console.log(
      `[RealPipelineEngine] Gate 0 APPROVED for project '${projectId}'. ` +
      `Reason: ${reason}. Project may now enter ideation stage.`
    );

    return { projectId, approved: true, reason };
  }

  /**
   * Skip Stage 0 and go directly to ideation (for projects that pre-validated their offer).
   */
  skipStage0(projectId: string, reason: string): void {
    const project = this.inner.getProject(projectId);
    if (!project) {
      throw new Error(`RealPipelineEngine.skipStage0: project '${projectId}' not found`);
    }
    this.jobValidationStatus.set(projectId, 'skipped');
    console.log(
      `[RealPipelineEngine] Stage 0 SKIPPED for project '${projectId}'. Reason: ${reason}`
    );
  }

  /**
   * Returns Stage 0 result for a project, or undefined if not yet executed.
   */
  getStage0Result(projectId: string): StageResult | undefined {
    return this.jobValidationResults.get(projectId);
  }

  getStage0Status(
    projectId: string
  ): 'pending' | 'in-progress' | 'awaiting-gate' | 'approved' | 'skipped' {
    return this.jobValidationStatus.get(projectId) ?? 'pending';
  }

  // ── Stage Progress ─────────────────────────────────────────────────────────

  /**
   * Returns the current stage progress of a project across the full 7-stage pipeline.
   */
  getStageProgress(projectId: string): StageProgress {
    const project = this.inner.getProject(projectId);
    const stage0Status = this.jobValidationStatus.get(projectId) ?? 'pending';

    // Determine current real stage
    let currentStage: RealStageName;

    if (!project || stage0Status === 'pending' || stage0Status === 'in-progress') {
      currentStage = 'job-validation';
    } else if (stage0Status === 'awaiting-gate') {
      currentStage = 'job-validation';
    } else {
      // stage0 approved or skipped — current stage comes from inner engine
      currentStage = (project?.currentStage ?? 'ideation') as RealStageName;
    }

    const stageIndex = REAL_STAGE_ORDER.indexOf(currentStage);
    const completedStages = Math.max(0, stageIndex);

    // Days remaining from start of current stage
    const remainingDays = REAL_STAGE_ORDER.slice(stageIndex).reduce(
      (sum, s) => sum + STAGE_ESTIMATED_DAYS[s],
      0
    );

    // Percentage based on completed stage-days vs total
    const completedDays = REAL_STAGE_ORDER.slice(0, stageIndex).reduce(
      (sum, s) => sum + STAGE_ESTIMATED_DAYS[s],
      0
    );
    const percentage = Math.round((completedDays / TOTAL_PIPELINE_DAYS) * 100);

    return {
      stage: currentStage,
      percentage,
      estimatedDays: remainingDays,
      completedStages,
      totalStages: REAL_STAGE_ORDER.length,
    };
  }

  // ── Delegate to inner PipelineEngine ──────────────────────────────────────

  createProject(metadata: ProjectMetadata): Project {
    const project = this.inner.createProject(metadata);
    // Initialize Stage 0 status for new projects
    this.jobValidationStatus.set(project.id, 'pending');
    return project;
  }

  startProject(projectId: string): Project {
    const stage0Status = this.jobValidationStatus.get(projectId) ?? 'pending';

    if (stage0Status === 'pending') {
      throw new Error(
        `RealPipelineEngine.startProject: Stage 0 (job-validation) must be executed and Gate 0 approved ` +
        `before starting project '${projectId}'. ` +
        `Call executeStage0() and approveGate0() first, or skipStage0() to bypass.`
      );
    }

    if (stage0Status === 'awaiting-gate') {
      throw new Error(
        `RealPipelineEngine.startProject: Gate 0 is awaiting CEO approval for project '${projectId}'. ` +
        `Call approveGate0() before starting.`
      );
    }

    return this.inner.startProject(projectId);
  }

  async executeCurrentStage(projectId: string): Promise<StageResult> {
    return this.inner.executeCurrentStage(projectId);
  }

  requestGateApproval(projectId: string): Gate {
    return this.inner.requestGateApproval(projectId);
  }

  processGateDecision(projectId: string, gateResult: GateResult): Project {
    return this.inner.processGateDecision(projectId, gateResult);
  }

  applyGateDecision(
    projectId: string,
    decision: 'approve' | 'reject' | 'request-changes',
    opts?: { reason?: string; conditions?: string[]; requiredChanges?: string[] }
  ): Project {
    return this.inner.applyGateDecision(projectId, decision, opts);
  }

  resubmitStage(projectId: string): Project {
    return this.inner.resubmitStage(projectId);
  }

  archiveProject(projectId: string, reason: string): Project {
    return this.inner.archiveProject(projectId, reason);
  }

  getProject(projectId: string): Project | undefined {
    return this.inner.getProject(projectId);
  }

  getAllProjects(): Project[] {
    return this.inner.getAllProjects();
  }

  getActiveProjects(): Project[] {
    return this.inner.getActiveProjects();
  }

  getPendingGateProjects(): Project[] {
    return this.inner.getPendingGateProjects();
  }

  getCompletedProjects(): Project[] {
    return this.inner.getCompletedProjects();
  }

  getSummaryStats(): ReturnType<PipelineEngine['getSummaryStats']> {
    return this.inner.getSummaryStats();
  }

  getInnerEngine(): PipelineEngine {
    return this.inner;
  }

  getJobValidationStage(): JobValidationStage {
    return jobValidationStage;
  }
}

// ─── Singleton Factory ────────────────────────────────────────────────────────

let _realEngineInstance: RealPipelineEngine | null = null;

/**
 * Returns the global RealPipelineEngine instance (lazy-init singleton).
 * Reuses the global router and PipelineEngine from D-5.
 */
export function getRealPipelineEngine(router?: MessageRouter): RealPipelineEngine {
  if (!_realEngineInstance) {
    _realEngineInstance = new RealPipelineEngine(
      router ?? getGlobalRouter(),
      getPipelineEngine(router ?? getGlobalRouter())
    );
  }
  return _realEngineInstance;
}

/** Replace the global real engine — useful in tests */
export function setRealPipelineEngine(engine: RealPipelineEngine): void {
  _realEngineInstance = engine;
}

/** Reset global real engine state — useful in tests */
export function resetRealPipelineEngine(): void {
  _realEngineInstance = null;
}
