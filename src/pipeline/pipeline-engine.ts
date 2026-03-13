// One Agent Corp — Pipeline Engine
// Domain D-5: State machine that manages project transitions between stages

import type { DepartmentId } from '../types/organization';
import { MessageRouter, getGlobalRouter } from '../messaging/router';

import type {
  Project,
  ProjectMetadata,
  StageName,
  StageResult,
  Gate,
  GateResult,
  PipelineStatus,
  PipelineEngineContract,
  TransitionEvent,
} from './types';
import { STAGE_ORDER } from './types';
import {
  GateSystem,
  createGate,
  requestCEOGateApproval,
  buildGateResult,
  getNextStage,
} from './gates';

import { IDEATION_CONFIG, executeIdeation, enterIdeation, exitIdeation } from './stages/ideation';
import { VALIDATION_CONFIG, executeValidation, enterValidation, exitValidation } from './stages/validation';
import { MVP_CONFIG, executeMVP, enterMVP, exitMVP } from './stages/mvp';
import { LAUNCH_CONFIG, executeLaunch, enterLaunch, exitLaunch } from './stages/launch';
import { GROWTH_CONFIG, executeGrowth, enterGrowth, exitGrowth } from './stages/growth';
import { SCALE_CONFIG, executeScale, enterScale, exitScale } from './stages/scale';

// ─── Stage Registry ───────────────────────────────────────────────────────────

const STAGE_EXECUTORS: Record<StageName, (project: Project) => StageResult> = {
  ideation: executeIdeation,
  validation: executeValidation,
  mvp: executeMVP,
  launch: executeLaunch,
  growth: executeGrowth,
  scale: executeScale,
};

const STAGE_ENTER_HOOKS: Partial<Record<StageName, (project: Project) => void>> = {
  validation: enterValidation,
  mvp: enterMVP,
  launch: enterLaunch,
  growth: enterGrowth,
  scale: enterScale,
};

const STAGE_EXIT_HOOKS: Partial<Record<StageName, (result: StageResult) => void>> = {
  ideation: exitIdeation,
  validation: exitValidation,
  mvp: exitMVP,
  launch: exitLaunch,
  growth: exitGrowth,
  scale: exitScale,
};

export {
  IDEATION_CONFIG, VALIDATION_CONFIG, MVP_CONFIG, LAUNCH_CONFIG, GROWTH_CONFIG, SCALE_CONFIG,
};

// ─── Project ID Generator ─────────────────────────────────────────────────────

let _projSeq = 0;

function generateProjectId(): string {
  _projSeq += 1;
  const ts = Date.now().toString(36);
  const seq = _projSeq.toString(36).padStart(4, '0');
  return `proj-${ts}-${seq}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

// ─── PipelineEngine ───────────────────────────────────────────────────────────

export class PipelineEngine implements PipelineEngineContract {
  private readonly projects = new Map<string, Project>();
  private readonly gateSystem = new GateSystem();
  private readonly router: MessageRouter;
  private readonly eventLog: TransitionEvent[] = [];

  constructor(router?: MessageRouter) {
    this.router = router ?? getGlobalRouter();
  }

  // ── Project Lifecycle ──────────────────────────────────────────────────────

  /**
   * Creates a new project in 'pending' status at the ideation stage.
   * Does NOT start execution — call startProject() to begin.
   */
  createProject(metadata: ProjectMetadata): Project {
    const id = generateProjectId();
    const now = nowIso();

    const project: Project = {
      id,
      metadata,
      currentStage: 'ideation',
      status: 'pending',
      stageResults: {},
      gates: [],
      budgetUsed: 0,
      currentMrr: 0,
      createdAt: now,
      updatedAt: now,
    };

    this.projects.set(id, project);
    this._emitEvent({ type: 'START', projectId: id });
    return project;
  }

  /**
   * Transitions a project from 'pending' to 'in-progress'.
   * Calls the enter hook for the first stage (ideation).
   */
  startProject(projectId: string): Project {
    const project = this._requireProject(projectId);

    if (project.status !== 'pending') {
      throw new Error(`startProject: project '${projectId}' is in status '${project.status}', expected 'pending'`);
    }

    // enterIdeation has no precondition check (first stage)
    enterIdeation(project);

    return this._updateProject(projectId, {
      status: 'in-progress',
      updatedAt: nowIso(),
    });
  }

  // ── Stage Execution ────────────────────────────────────────────────────────

  /**
   * Executes the current stage of the project.
   * Requires project status = 'in-progress'.
   * After execution, status moves to 'awaiting-gate'.
   */
  async executeCurrentStage(projectId: string): Promise<StageResult> {
    const project = this._requireProject(projectId);

    if (project.status !== 'in-progress') {
      throw new Error(
        `executeCurrentStage: project '${projectId}' is in status '${project.status}', expected 'in-progress'`
      );
    }

    const stage = project.currentStage;
    const executor = STAGE_EXECUTORS[stage];

    if (!executor) {
      throw new Error(`executeCurrentStage: no executor registered for stage '${stage}'`);
    }

    // Execute stage (synchronous simulation, awaitable for future async stages)
    const result: StageResult = await Promise.resolve(executor(project));

    // Run exit hook
    const exitHook = STAGE_EXIT_HOOKS[stage];
    if (exitHook) exitHook(result);

    // Store result in project
    const updatedStageResults = { ...project.stageResults, [stage]: result };

    // Update MRR from stage metrics if available
    const stageMrr =
      result.metrics['launch_mrr'] ??
      result.metrics['current_mrr'] ??
      result.metrics['final_mrr'] ??
      project.currentMrr;

    this._updateProject(projectId, {
      stageResults: updatedStageResults,
      currentMrr: stageMrr,
      status: 'awaiting-gate',
      updatedAt: nowIso(),
    });

    this._emitEvent({ type: 'STAGE_COMPLETE', projectId, stageResult: result });

    return result;
  }

  // ── Gate Management ────────────────────────────────────────────────────────

  /**
   * Creates a gate and requests CEO approval via messaging.
   * Requires project status = 'awaiting-gate'.
   */
  requestGateApproval(projectId: string): Gate {
    const project = this._requireProject(projectId);

    if (project.status !== 'awaiting-gate') {
      throw new Error(
        `requestGateApproval: project '${projectId}' is in status '${project.status}', expected 'awaiting-gate'`
      );
    }

    const stageResult = project.stageResults[project.currentStage];
    if (!stageResult) {
      throw new Error(`requestGateApproval: no stage result found for stage '${project.currentStage}'`);
    }

    const gate = createGate(project, stageResult);
    this.gateSystem.register(gate);

    // Determine which department sends the approval request (first responsible department)
    const stageConfigs = this._getStageConfig(project.currentStage);
    const fromDepartment: DepartmentId = stageConfigs.departments[0] ?? 'product';

    // Send CEO gate approval request via messaging
    requestCEOGateApproval(gate, project, this.router, fromDepartment);

    // Record pending gate in project
    this._updateProject(projectId, {
      gates: [...project.gates, gate],
      pendingGateId: gate.id,
      updatedAt: nowIso(),
    });

    return gate;
  }

  /**
   * Processes a CEO gate decision (approve/reject/request-changes).
   * Updates project status and transitions to next stage if approved.
   */
  processGateDecision(projectId: string, gateResult: GateResult): Project {
    const project = this._requireProject(projectId);

    if (!project.pendingGateId) {
      throw new Error(`processGateDecision: project '${projectId}' has no pending gate`);
    }

    if (gateResult.gateId !== project.pendingGateId) {
      throw new Error(
        `processGateDecision: gate id mismatch. Expected '${project.pendingGateId}', got '${gateResult.gateId}'`
      );
    }

    // Resolve gate in system
    const resolvedGate = this.gateSystem.resolve(gateResult.gateId, gateResult);

    // Update gate in project gates array
    const updatedGates = project.gates.map(g =>
      g.id === resolvedGate.id ? resolvedGate : g
    );

    this._emitEvent({ type: 'GATE_DECISION', projectId, gateResult });

    if (gateResult.decision === 'approve') {
      return this._handleApproval(project, resolvedGate, updatedGates, gateResult);
    } else if (gateResult.decision === 'reject') {
      return this._handleRejection(project, updatedGates, gateResult);
    } else {
      // request-changes
      return this._handleChangesRequest(project, updatedGates, gateResult);
    }
  }

  // ── State Machine Transitions ──────────────────────────────────────────────

  private _handleApproval(
    project: Project,
    resolvedGate: Gate,
    updatedGates: Gate[],
    gateResult: GateResult
  ): Project {
    const nextStage = gateResult.toStage;

    if (nextStage === null) {
      // Final stage completed — pipeline done
      return this._updateProject(project.id, {
        status: 'completed',
        gates: updatedGates,
        pendingGateId: undefined,
        completedAt: nowIso(),
        updatedAt: nowIso(),
      });
    }

    // Transition to next stage
    const enterHook = STAGE_ENTER_HOOKS[nextStage];

    // Build the updated project snapshot for the hook (before committing)
    const preTransitionProject: Project = {
      ...this._requireProject(project.id),
      currentStage: nextStage,
      gates: updatedGates,
      pendingGateId: undefined,
    };

    if (enterHook) {
      enterHook(preTransitionProject);
    }

    return this._updateProject(project.id, {
      currentStage: nextStage,
      status: 'in-progress',
      gates: updatedGates,
      pendingGateId: undefined,
      updatedAt: nowIso(),
    });
  }

  private _handleRejection(
    project: Project,
    updatedGates: Gate[],
    gateResult: GateResult
  ): Project {
    return this._updateProject(project.id, {
      status: 'rejected',
      gates: updatedGates,
      pendingGateId: undefined,
      updatedAt: nowIso(),
    });
  }

  private _handleChangesRequest(
    project: Project,
    updatedGates: Gate[],
    gateResult: GateResult
  ): Project {
    // Project stays in current stage, goes back to in-progress to rework
    return this._updateProject(project.id, {
      status: 'changes-requested',
      gates: updatedGates,
      pendingGateId: undefined,
      updatedAt: nowIso(),
    });
  }

  // ── Convenience: Full Auto Gate ────────────────────────────────────────────

  /**
   * Automatically creates and immediately resolves a gate with a CEO decision.
   * Useful for programmatic pipeline progression without async messaging.
   */
  applyGateDecision(
    projectId: string,
    decision: 'approve' | 'reject' | 'request-changes',
    opts?: { reason?: string; conditions?: string[]; requiredChanges?: string[] }
  ): Project {
    const gate = this.requestGateApproval(projectId);
    const project = this._requireProject(projectId);
    const stageResult = project.stageResults[project.currentStage]!;

    const gateResult = buildGateResult({
      gate,
      decision,
      reason: opts?.reason ?? `CEO ${decision} for stage '${gate.fromStage}'`,
      conditions: opts?.conditions,
      requiredChanges: opts?.requiredChanges,
      score: decision === 'approve' ? 80 : decision === 'request-changes' ? 50 : 20,
    });

    return this.processGateDecision(projectId, gateResult);
  }

  /**
   * Convenience: re-enter a stage after 'changes-requested'.
   * Resets status to 'in-progress' so executeCurrentStage can run again.
   */
  resubmitStage(projectId: string): Project {
    const project = this._requireProject(projectId);

    if (project.status !== 'changes-requested') {
      throw new Error(
        `resubmitStage: project '${projectId}' is in status '${project.status}', expected 'changes-requested'`
      );
    }

    return this._updateProject(projectId, {
      status: 'in-progress',
      updatedAt: nowIso(),
    });
  }

  /**
   * Archive a project (soft delete — preserves history).
   */
  archiveProject(projectId: string, reason: string): Project {
    const project = this._requireProject(projectId);

    this._emitEvent({ type: 'ARCHIVE', projectId, reason });

    return this._updateProject(projectId, {
      status: 'archived',
      updatedAt: nowIso(),
    });
  }

  // ── Queries ────────────────────────────────────────────────────────────────

  getProject(projectId: string): Project | undefined {
    return this.projects.get(projectId);
  }

  getAllProjects(): Project[] {
    return [...this.projects.values()];
  }

  getActiveProjects(): Project[] {
    return [...this.projects.values()].filter(
      p => p.status === 'in-progress' || p.status === 'awaiting-gate'
    );
  }

  getPendingGateProjects(): Project[] {
    return [...this.projects.values()].filter(p => p.status === 'awaiting-gate');
  }

  getCompletedProjects(): Project[] {
    return [...this.projects.values()].filter(p => p.status === 'completed');
  }

  getProjectsByStage(stage: StageName): Project[] {
    return [...this.projects.values()].filter(p => p.currentStage === stage);
  }

  getGateSystem(): GateSystem {
    return this.gateSystem;
  }

  getEventLog(): ReadonlyArray<TransitionEvent> {
    return [...this.eventLog];
  }

  /** Summary statistics across all projects */
  getSummaryStats(): {
    total: number;
    byStatus: Record<PipelineStatus, number>;
    byStage: Record<StageName, number>;
    totalMrr: number;
    avgCompletionRate: number;
  } {
    const all = [...this.projects.values()];

    const byStatus = all.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] ?? 0) + 1;
      return acc;
    }, {} as Record<PipelineStatus, number>);

    const byStage = all.reduce((acc, p) => {
      acc[p.currentStage] = (acc[p.currentStage] ?? 0) + 1;
      return acc;
    }, {} as Record<StageName, number>);

    const totalMrr = all.reduce((sum, p) => sum + p.currentMrr, 0);

    const completedCount = all.filter(p => p.status === 'completed').length;
    const avgCompletionRate = all.length > 0 ? Math.round((completedCount / all.length) * 100) : 0;

    return { total: all.length, byStatus, byStage, totalMrr, avgCompletionRate };
  }

  // ── Private Helpers ────────────────────────────────────────────────────────

  private _requireProject(projectId: string): Project {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`PipelineEngine: project '${projectId}' not found`);
    }
    return project;
  }

  private _updateProject(projectId: string, patch: Partial<Project>): Project {
    const existing = this._requireProject(projectId);
    const updated: Project = { ...existing, ...patch };
    this.projects.set(projectId, updated);
    return updated;
  }

  private _getStageConfig(stage: StageName) {
    const configs = {
      ideation: IDEATION_CONFIG,
      validation: VALIDATION_CONFIG,
      mvp: MVP_CONFIG,
      launch: LAUNCH_CONFIG,
      growth: GROWTH_CONFIG,
      scale: SCALE_CONFIG,
    };
    return configs[stage];
  }

  private _emitEvent(event: TransitionEvent): void {
    this.eventLog.push(event);
  }
}

// ─── Singleton Factory ────────────────────────────────────────────────────────

let _engineInstance: PipelineEngine | null = null;

/**
 * Returns the global PipelineEngine instance (lazy-init singleton).
 * Uses the global router from D-2.
 */
export function getPipelineEngine(router?: MessageRouter): PipelineEngine {
  if (!_engineInstance) {
    _engineInstance = new PipelineEngine(router ?? getGlobalRouter());
  }
  return _engineInstance;
}

/** Replace the global engine — useful in tests */
export function setPipelineEngine(engine: PipelineEngine): void {
  _engineInstance = engine;
}

/** Reset global engine state — useful in tests */
export function resetPipelineEngine(): void {
  _engineInstance = null;
}
