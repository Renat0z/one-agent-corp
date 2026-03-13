// One Agent Corp — Pipeline Types
// Domain D-5: Micro-SaaS Factory Pipeline — state machine types

import type { DepartmentId } from '../types/organization';

// ─── Stage Names ──────────────────────────────────────────────────────────────

export type StageName =
  | 'ideation'
  | 'validation'
  | 'mvp'
  | 'launch'
  | 'growth'
  | 'scale';

export const STAGE_ORDER: readonly StageName[] = [
  'ideation',
  'validation',
  'mvp',
  'launch',
  'growth',
  'scale',
] as const;

// ─── Pipeline Status ──────────────────────────────────────────────────────────

export type PipelineStatus =
  | 'pending'           // created, not started
  | 'in-progress'       // current stage executing
  | 'awaiting-gate'     // stage done, waiting CEO approval
  | 'approved'          // CEO approved, transitioning to next stage
  | 'rejected'          // CEO rejected — project paused
  | 'changes-requested' // CEO requested changes before advancing
  | 'completed'         // all 6 stages done
  | 'archived';         // project removed from active pipeline

// ─── Gate Decision ────────────────────────────────────────────────────────────

export type GateDecision = 'approve' | 'reject' | 'request-changes';

export interface GateResult {
  decision: GateDecision;
  score: number;              // 0-100
  gateId: string;             // e.g. "gate-ideation-validation"
  fromStage: StageName;
  toStage: StageName | null;  // null if rejected (stays in stage or archived)
  decidedAt: string;          // ISO-8601
  decidedBy: 'ceo';
  conditions?: string[];      // apply only if approved
  requiredChanges?: string[]; // apply only if request-changes
  reason: string;
}

// ─── Deliverable ──────────────────────────────────────────────────────────────

export interface Deliverable {
  id: string;
  name: string;
  description: string;
  owner: DepartmentId;
  status: 'pending' | 'in-progress' | 'done' | 'blocked';
  completedAt?: string;
  artifact?: string;          // URL, file path, or inline summary
}

// ─── Stage Result ─────────────────────────────────────────────────────────────

export interface StageResult {
  stage: StageName;
  status: 'success' | 'failure' | 'blocked';
  deliverables: Deliverable[];
  metrics: Record<string, number>;  // measurable output metrics
  blockers: string[];
  next_stage_ready: boolean;        // true if all pass-criteria met
  summary: string;
  completedAt: string;
  insights: string[];               // learnings to carry forward
}

// ─── Stage Config (static definition) ────────────────────────────────────────

export interface PassCriterion {
  id: string;
  description: string;
  metric?: string;            // key in StageResult.metrics
  minValue?: number;          // minimum threshold
  required: boolean;          // if true: blocking — stage cannot advance without it
}

export interface StageConfig {
  name: StageName;
  displayName: string;
  description: string;
  departments: DepartmentId[];           // departments involved in this stage
  estimatedDays: number;                 // expected duration
  deliverableTemplates: Omit<Deliverable, 'status' | 'completedAt' | 'artifact'>[];
  passCriteria: PassCriterion[];
  gateLabel: string;                     // human-readable gate name
}

// ─── Gate (runtime instance) ──────────────────────────────────────────────────

export interface Gate {
  id: string;
  fromStage: StageName;
  toStage: StageName | null;
  stageResult: StageResult;
  status: 'pending' | 'approved' | 'rejected' | 'changes-requested';
  requestedAt: string;
  result?: GateResult;
}

// ─── Project ──────────────────────────────────────────────────────────────────

export interface ProjectMetadata {
  name: string;
  description: string;
  budget: number;           // USD allocated
  targetMrr: number;        // monthly recurring revenue target
  riskLevel: 'low' | 'medium' | 'high';
  priority: 'low' | 'normal' | 'high' | 'critical';
  strategicAlignment: string;
  owner: DepartmentId;
  departments: DepartmentId[];
}

export interface Project {
  id: string;
  metadata: ProjectMetadata;
  currentStage: StageName;
  status: PipelineStatus;
  stageResults: Partial<Record<StageName, StageResult>>;
  gates: Gate[];
  budgetUsed: number;
  currentMrr: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  pendingGateId?: string;     // gate currently awaiting CEO decision
}

// ─── Pipeline Transition Event ────────────────────────────────────────────────

export type TransitionEvent =
  | { type: 'START'; projectId: string }
  | { type: 'STAGE_COMPLETE'; projectId: string; stageResult: StageResult }
  | { type: 'GATE_DECISION'; projectId: string; gateResult: GateResult }
  | { type: 'ARCHIVE'; projectId: string; reason: string };

// ─── Pipeline Engine Contract ─────────────────────────────────────────────────

export interface PipelineEngineContract {
  createProject(metadata: ProjectMetadata): Project;
  startProject(projectId: string): Project;
  executeCurrentStage(projectId: string): Promise<StageResult>;
  requestGateApproval(projectId: string): Gate;
  processGateDecision(projectId: string, gateResult: GateResult): Project;
  getProject(projectId: string): Project | undefined;
  getAllProjects(): Project[];
  getActiveProjects(): Project[];
}
