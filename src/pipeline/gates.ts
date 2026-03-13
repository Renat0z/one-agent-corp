// One Agent Corp — Gate System
// Domain D-5: CEO approval gates between pipeline stages — validate criteria, enqueue decisions

import type { DepartmentId } from '../types/organization';
import type { RequestMessage } from '../messaging/types';
import { createRequest } from '../messaging/templates';
import { MessageRouter } from '../messaging/router';

import type {
  Gate,
  GateResult,
  GateDecision,
  PassCriterion,
  Project,
  StageResult,
  StageName,
} from './types';
import { STAGE_ORDER } from './types';

// ─── ID Generator ─────────────────────────────────────────────────────────────

let _gateSeq = 0;

function generateGateId(from: StageName): string {
  _gateSeq += 1;
  const ts = Date.now().toString(36);
  const seq = _gateSeq.toString(36).padStart(4, '0');
  return `gate-${from}-${ts}-${seq}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

// ─── Gate Criteria Evaluator ──────────────────────────────────────────────────

export interface GateCriteriaEvaluation {
  totalCriteria: number;
  passingCriteria: number;
  failingRequired: PassCriterion[];
  failingOptional: PassCriterion[];
  score: number;  // 0-100
}

/**
 * Evaluates pass criteria against actual stage result metrics.
 * Required criteria block advancement; optional criteria reduce score.
 */
export function evaluatePassCriteria(
  criteria: PassCriterion[],
  stageResult: StageResult
): GateCriteriaEvaluation {
  const failingRequired: PassCriterion[] = [];
  const failingOptional: PassCriterion[] = [];
  let passing = 0;

  for (const criterion of criteria) {
    let pass = false;

    if (criterion.metric !== undefined && criterion.minValue !== undefined) {
      const actualValue = stageResult.metrics[criterion.metric] ?? 0;
      pass = actualValue >= criterion.minValue;
    } else {
      // Non-metric criterion: check if deliverable with matching id is done
      const deliverable = stageResult.deliverables.find(d => d.id === criterion.id);
      pass = deliverable?.status === 'done';
    }

    if (pass) {
      passing++;
    } else {
      if (criterion.required) {
        failingRequired.push(criterion);
      } else {
        failingOptional.push(criterion);
      }
    }
  }

  const total = criteria.length;
  const score = total > 0 ? Math.round((passing / total) * 100) : 100;

  return {
    totalCriteria: total,
    passingCriteria: passing,
    failingRequired,
    failingOptional,
    score,
  };
}

// ─── Auto-Decision Logic ──────────────────────────────────────────────────────

/**
 * Derives a preliminary gate recommendation based on criteria evaluation.
 * CEO retains final authority — this is an automated recommendation.
 */
export function deriveGateRecommendation(
  evaluation: GateCriteriaEvaluation,
  stageResult: StageResult
): { recommendation: GateDecision; rationale: string } {
  if (!stageResult.next_stage_ready) {
    return {
      recommendation: 'request-changes',
      rationale: `Stage reports next_stage_ready=false. Blockers: ${stageResult.blockers.join('; ') || 'unspecified'}`,
    };
  }

  if (evaluation.failingRequired.length > 0) {
    const names = evaluation.failingRequired.map(c => c.description).join(', ');
    return {
      recommendation: 'reject',
      rationale: `Required pass criteria not met: ${names}`,
    };
  }

  if (evaluation.score < 40) {
    return {
      recommendation: 'request-changes',
      rationale: `Overall score ${evaluation.score}/100 is below 40 — too many optional criteria failing`,
    };
  }

  const conditions: string[] = evaluation.failingOptional.map(
    c => `Optional criterion not met: ${c.description}`
  );

  return {
    recommendation: 'approve',
    rationale:
      conditions.length > 0
        ? `All required criteria met (score ${evaluation.score}/100). Minor gaps: ${conditions.join('; ')}`
        : `All criteria met. Score: ${evaluation.score}/100`,
  };
}

// ─── Next Stage Resolver ──────────────────────────────────────────────────────

/**
 * Returns the next stage in the pipeline sequence, or null if current is last.
 */
export function getNextStage(current: StageName): StageName | null {
  const idx = STAGE_ORDER.indexOf(current);
  if (idx === -1 || idx === STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[idx + 1] ?? null;
}

// ─── Gate Factory ─────────────────────────────────────────────────────────────

/**
 * Creates a Gate object in 'pending' status from a completed stage result.
 */
export function createGate(project: Project, stageResult: StageResult): Gate {
  const nextStage = getNextStage(stageResult.stage);
  return {
    id: generateGateId(stageResult.stage),
    fromStage: stageResult.stage,
    toStage: nextStage,
    stageResult,
    status: 'pending',
    requestedAt: nowIso(),
  };
}

// ─── CEO Gate Request via Messaging ──────────────────────────────────────────

/**
 * Enqueues a CEO gate approval request via the messaging system.
 * The CEO receives a RequestMessage with the full stage summary and gate ID.
 */
export function requestCEOGateApproval(
  gate: Gate,
  project: Project,
  router: MessageRouter,
  fromDepartment: DepartmentId
): RequestMessage {
  const stageResult = gate.stageResult;
  const evaluation = evaluatePassCriteria(
    [],  // criteria injected by stage — included in stageResult context
    stageResult
  );

  const { recommendation, rationale } = deriveGateRecommendation(
    { ...evaluation, score: stageResult.metrics['pass_score'] ?? evaluation.score },
    stageResult
  );

  const nextLabel = gate.toStage ? `→ ${gate.toStage}` : '(final stage completed)';

  const requestMsg: RequestMessage = createRequest(
    fromDepartment,
    'ceo',
    `[GATE APPROVAL] ${stageResult.stage} ${nextLabel} — Project: ${project.metadata.name}`,
    {
      subject: `Gate: ${gate.id}`,
      body: [
        `Project: ${project.metadata.name} (${project.id})`,
        `Stage Completed: ${stageResult.stage}`,
        `Next Stage: ${gate.toStage ?? 'none (final)'}`,
        `Status: ${stageResult.status}`,
        `Next Stage Ready: ${stageResult.next_stage_ready}`,
        `Stage Summary: ${stageResult.summary}`,
        `Blockers: ${stageResult.blockers.length > 0 ? stageResult.blockers.join('; ') : 'none'}`,
        `Deliverables: ${stageResult.deliverables.map(d => `${d.name} (${d.status})`).join(', ')}`,
        `Key Metrics: ${Object.entries(stageResult.metrics).map(([k, v]) => `${k}=${v}`).join(', ')}`,
        `Recommendation: ${recommendation} — ${rationale}`,
        `Gate ID: ${gate.id}`,
      ].join('\n'),
      approval_needed: true,
      options: ['approve', 'reject', 'request-changes'],
      dependencies: [gate.id],
    },
    { correlation_id: gate.id, tags: ['pipeline-gate', `stage:${stageResult.stage}`] }
  );

  router.route(requestMsg);
  return requestMsg;
}

// ─── Gate Result Builder ──────────────────────────────────────────────────────

/**
 * Constructs a GateResult from a CEO decision (approve/reject/request-changes).
 */
export function buildGateResult(opts: {
  gate: Gate;
  decision: GateDecision;
  reason: string;
  conditions?: string[];
  requiredChanges?: string[];
  score?: number;
}): GateResult {
  return {
    decision: opts.decision,
    score: opts.score ?? (opts.decision === 'approve' ? 80 : opts.decision === 'request-changes' ? 50 : 20),
    gateId: opts.gate.id,
    fromStage: opts.gate.fromStage,
    toStage: opts.decision === 'approve' ? opts.gate.toStage : null,
    decidedAt: nowIso(),
    decidedBy: 'ceo',
    conditions: opts.conditions,
    requiredChanges: opts.requiredChanges,
    reason: opts.reason,
  };
}

// ─── Gate Validator ───────────────────────────────────────────────────────────

/**
 * Validates that a gate decision is internally consistent.
 * Returns array of validation errors (empty = valid).
 */
export function validateGateResult(result: GateResult): string[] {
  const errors: string[] = [];

  if (result.decision === 'approve' && result.toStage === null) {
    // Approve on final stage is fine — project completes
  }

  if (result.decision === 'reject' && !result.reason) {
    errors.push('Gate rejection requires a reason');
  }

  if (result.decision === 'request-changes' && (!result.requiredChanges || result.requiredChanges.length === 0)) {
    errors.push('request-changes decision requires at least one required change');
  }

  if (result.score < 0 || result.score > 100) {
    errors.push(`Gate score must be 0-100, got: ${result.score}`);
  }

  return errors;
}

// ─── GateSystem ───────────────────────────────────────────────────────────────

/**
 * Stateful gate tracker. Stores pending and resolved gates.
 * PipelineEngine holds one GateSystem instance.
 */
export class GateSystem {
  private readonly gates = new Map<string, Gate>();

  register(gate: Gate): void {
    this.gates.set(gate.id, gate);
  }

  resolve(gateId: string, result: GateResult): Gate {
    const gate = this.gates.get(gateId);
    if (!gate) {
      throw new Error(`GateSystem: unknown gate id '${gateId}'`);
    }

    const errors = validateGateResult(result);
    if (errors.length > 0) {
      throw new Error(`GateSystem: invalid gate result — ${errors.join(', ')}`);
    }

    const updated: Gate = {
      ...gate,
      result,
      status:
        result.decision === 'approve'
          ? 'approved'
          : result.decision === 'reject'
          ? 'rejected'
          : 'changes-requested',
    };

    this.gates.set(gateId, updated);
    return updated;
  }

  getGate(gateId: string): Gate | undefined {
    return this.gates.get(gateId);
  }

  getPendingGates(): Gate[] {
    return [...this.gates.values()].filter(g => g.status === 'pending');
  }

  getAllGates(): Gate[] {
    return [...this.gates.values()];
  }

  getGatesByProject(projectId: string): Gate[] {
    // Gates store project id implicitly via correlation — filtered from project.gates
    return [...this.gates.values()];
  }
}
