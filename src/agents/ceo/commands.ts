// One Agent Corp — CEO Commands
// Domain D-3: Typed commands the CEO can execute, each returning CommandResult

import type { DepartmentId } from '../../types/organization';
import type { DirectiveMessage, RoutingResult } from '../../messaging/types';

// ─── Result Types ─────────────────────────────────────────────────────────────

export type CommandStatus = 'approved' | 'rejected' | 'pending' | 'executed' | 'error';

export interface CommandResult<T = unknown> {
  status: CommandStatus;
  command: string;
  timestamp: string;
  data?: T;
  reason?: string;
  routing?: RoutingResult;
}

// ─── Command Payloads ─────────────────────────────────────────────────────────

export interface LaunchCommand {
  kind: 'launch-project';
  projectName: string;
  description: string;
  budget: number;                          // USD
  targetMrr: number;                       // Monthly recurring revenue target
  timeline: string;                        // e.g. "4 weeks", "2026-04-30"
  departments: DepartmentId[];             // Departments involved
  strategicAlignment: string;             // How it aligns with company vision
  riskLevel: 'low' | 'medium' | 'high';
  priority: 'low' | 'normal' | 'high' | 'critical';
}

export interface ApprovalCommand {
  kind: 'approve';
  proposalId: string;                      // Correlation ID of the pending request/escalation
  reason?: string;
  conditions?: string[];                  // Optional conditions for approval
  allocatedBudget?: number;
}

export interface RejectCommand {
  kind: 'reject';
  proposalId: string;
  reason: string;
  feedback?: string;                      // What needs to change for resubmission
  canResubmit: boolean;
}

export interface EscalateCommand {
  kind: 'escalate';
  targetDepartment: DepartmentId;
  issue: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  requiredResolution: string;
  deadline?: string;
}

export interface StatusCommand {
  kind: 'status';
  scope: 'all' | DepartmentId | 'projects';
  includeKpis?: boolean;
  includeEscalations?: boolean;
}

export interface BroadcastCommand {
  kind: 'broadcast';
  action: string;
  objective: string;
  targetDepartments?: DepartmentId[];     // undefined = all departments
  deadline?: string;
  context?: Record<string, unknown>;
}

export interface CreateCycleCommand {
  kind: 'create-cycle';
  projectId: string;
  hypothesis: string;         // "Se eu fizer X, Y sobe Z%"
  minimumTest: string;        // teste mais rápido possível
  targetMetric: string;
  targetValue: number;
  department: DepartmentId;
  estimatedDuration: string;  // "15min", "2h", "3d"
  iceScore: { impact: number; confidence: number; ease: number };
}

export interface DecideCycleCommand {
  kind: 'decide-cycle';
  cycleId: string;
  decision: 'scale' | 'adjust' | 'kill';
  reason: string;
  nextActions?: string[];
}

export interface CycleBoardCommand {
  kind: 'cycle-board';
  projectId?: string;        // filtrar por projeto (undefined = todos)
}

export interface CycleVelocityCommand {
  kind: 'cycle-velocity';
  period?: string;           // "2026-W10", undefined = current week
}

export interface CreateTriggerCommand {
  kind: 'create-trigger';
  name: string;
  description: string;
  event: {
    type: 'cycle_completed' | 'cycle_result_ready' | 'escalation_received' |
          'gate_pending' | 'kpi_breach' | 'velocity_drop' | 'pipeline_stage_complete';
    filter?: Record<string, unknown>;   // filtros opcionais (projectId, severity, etc)
  };
  action: {
    type: 'claude_cli' | 'send_directive' | 'notify_ceo' | 'create_cycle';
    prompt?: string;
    directive?: { to: string | string[]; action: string; objective: string };
  };
  maxFires?: number;        // 1 = one-shot, undefined = ilimitado
  cooldownMs?: number;      // tempo mínimo entre disparos
}

export interface CreateScheduleCommand {
  kind: 'create-schedule';
  name: string;
  cron: string;             // "0 9 * * 1-5" (seg-sex 9h)
  action: {
    type: 'claude_cli' | 'send_directive' | 'send_report';
    prompt?: string;
  };
}

export interface ListAutomationsCommand {
  kind: 'list-automations';
  filter?: 'triggers' | 'schedules' | 'all';
}

export interface ActivatePresetCommand {
  kind: 'activate-preset';
  preset: 'daily-standup' | 'weekly-scorecard' | 'cycle-velocity-check' |
          'pipeline-gate-reminder' | 'on-cycle-result' | 'on-escalation-critical' |
          'on-kpi-breach' | 'on-velocity-drop' | 'new-project-setup';
}

/** Discriminated union of all CEO commands */
export type CEOCommand =
  | LaunchCommand
  | ApprovalCommand
  | RejectCommand
  | EscalateCommand
  | StatusCommand
  | BroadcastCommand
  | CreateCycleCommand
  | DecideCycleCommand
  | CycleBoardCommand
  | CycleVelocityCommand
  | CreateTriggerCommand
  | CreateScheduleCommand
  | ListAutomationsCommand
  | ActivatePresetCommand;

// ─── Status & Dashboard Types ─────────────────────────────────────────────────

export type KPIHealth = 'green' | 'yellow' | 'red';

export interface KPISnapshot {
  id: string;
  name: string;
  currentValue: number;
  target: number;
  unit: string;
  health: KPIHealth;
  trend: 'up' | 'down' | 'flat';
  lastUpdated: string;
}

export interface EscalationSummary {
  messageId: string;
  from: DepartmentId;
  incident: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  since: string;
  status: 'pending' | 'in-progress' | 'resolved';
}

export interface DeptStatus {
  id: DepartmentId;
  name: string;
  health: KPIHealth;                       // Aggregate health signal
  kpis: KPISnapshot[];
  activeProjects: string[];
  pendingEscalations: EscalationSummary[];
  lastReportAt: string | null;
  autonomyLevel: 'full' | 'high' | 'medium' | 'low';
}

export interface ActiveProject {
  id: string;
  name: string;
  stage: 'ideation' | 'validation' | 'mvp' | 'launch' | 'growth' | 'scale';
  health: KPIHealth;
  budget: number;
  budgetUsed: number;
  targetMrr: number;
  currentMrr: number;
  departments: DepartmentId[];
  startedAt: string;
  targetDeadline?: string;
  pendingGate: boolean;                   // Waiting for CEO gate approval
}

export interface CompanyMetrics {
  totalMrr: number;
  mrrGrowthRate: number;                  // percentage MoM
  activeProjects: number;
  pendingApprovals: number;
  openEscalations: number;
  burnRate: number;                       // USD/month
  runway: number;                         // months
  cycleVelocity: number;                  // ciclos completos na semana atual
  cycleVelocityRating: 'beginner' | 'good' | 'excellent';
  activeCycles: number;
  pendingCycleDecisions: number;          // ciclos no status 'result' esperando decisão
}

// ─── Routing Outcome ──────────────────────────────────────────────────────────

export interface DispatchResult {
  message: DirectiveMessage;
  routing: RoutingResult;
}
