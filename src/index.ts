// One Agent Corp — Entry Point
// Re-exports all modules for convenient external consumption

// ─── D-1: Organization Types & Config ────────────────────────────────────────

export type {
  Organization,
  OrganizationConfig,
  Department,
  DepartmentId,
  DepartmentInteraction,
  KPI,
  KPIUnit,
  Persona,
  CommunicationStyle,
  InteractionFrequency,
} from './types/organization';

export {
  organization,
  organizationConfig,
  getDepartment,
  getInteractions,
  getKPIs,
  validateKPI,
  getAllDepartmentIds,
  getInteractionsBetween,
} from './config/company-structure';

// ─── D-2: Messaging System ──────────────────────────────────────────────────

export type {
  MessageType,
  Priority,
  MessageStatus,
  ActorId,
  DirectivePayload,
  ReportPayload,
  RequestPayload,
  EscalationPayload,
  MessagePayload,
  DirectiveMessage,
  ReportMessage,
  RequestMessage,
  EscalationMessage,
  Message,
  RoutingResult,
  MessageHandler,
  Router,
  QueueEntry,
  Queue,
} from './messaging/types';

export { PRIORITY_MAP } from './messaging/types';

export {
  MessageRouter,
  getGlobalRouter,
  setGlobalRouter,
} from './messaging/router';

export type { RouterMiddleware } from './messaging/router';

export {
  PriorityQueue,
  createQueue,
} from './messaging/queue';

export {
  createDirective,
  createReport,
  createRequest,
  createEscalation,
  broadcastDirective,
  launchDirective,
  weeklyStatusReport,
  budgetApprovalRequest,
  blockingEscalation,
  specCollaborationRequest,
  conversionMetricsReport,
  MessageTemplates,
} from './messaging/templates';

export type { ValidationResult } from './messaging/schemas';

export {
  validateMessage,
  assertValidMessage,
  isValidDepartment,
  isDirectivePayload,
  isReportPayload,
  isRequestPayload,
  isEscalationPayload,
} from './messaging/schemas';

// ─── D-3: CEO Agent ────────────────────────────────────────────────────────

export {
  CEOAgent,
  getCEOAgent,
  setCEOAgent,
  resetCEOAgent,
  Dashboard,
  DecisionEngine,
  DEFAULT_DECISION_CONTEXT,
} from './agents/ceo/ceo-agent';

export type {
  DecisionContext,
  DecisionResult,
  DecisionCriteria,
} from './agents/ceo/ceo-agent';

export type {
  CEOCommand,
  CommandResult,
  CommandStatus,
  LaunchCommand,
  ApprovalCommand,
  RejectCommand,
  EscalateCommand,
  StatusCommand,
  BroadcastCommand,
  ActiveProject,
  DeptStatus,
  KPISnapshot,
  KPIHealth,
  EscalationSummary,
  CompanyMetrics,
  DispatchResult,
} from './agents/ceo/commands';

// ─── D-4: Department Agents ────────────────────────────────────────────────

export {
  BaseDepartment,
} from './agents/departments/base-department';

export type {
  Task,
  TaskResult,
  Report,
} from './agents/departments/base-department';

// ─── D-5: Pipeline ─────────────────────────────────────────────────────────

export type {
  StageName,
  PipelineStatus,
  GateDecision,
  GateResult,
  Deliverable,
  StageResult,
  PassCriterion,
  StageConfig,
  Gate,
  ProjectMetadata,
  Project,
  TransitionEvent,
  PipelineEngineContract,
} from './pipeline/types';

export { STAGE_ORDER } from './pipeline/types';

export {
  PipelineEngine,
  getPipelineEngine,
  setPipelineEngine,
  resetPipelineEngine,
  IDEATION_CONFIG,
  VALIDATION_CONFIG,
  MVP_CONFIG,
  LAUNCH_CONFIG,
  GROWTH_CONFIG,
  SCALE_CONFIG,
} from './pipeline/pipeline-engine';

export {
  GateSystem,
  createGate,
  requestCEOGateApproval,
  buildGateResult,
  validateGateResult,
  evaluatePassCriteria,
  deriveGateRecommendation,
  getNextStage,
} from './pipeline/gates';

// ─── D-6: Playbooks ────────────────────────────────────────────────────────

export type {
  PlaybookId,
  PlaybookStage,
  TargetMarket,
  GrowthMetric,
  MetricOperator,
  Tactic,
  TacticStatus,
  TacticDirective,
  Playbook,
  PlaybookConfig,
  ProjectState,
  PlaybookResult,
  MetricEvaluation,
  TacticExecution,
  PlaybookSelectionCriteria,
  IPlaybookEngine,
} from './playbooks/types';

export {
  PlaybookEngine,
  playbookEngine,
  selectPlaybooksForProject,
  runAllPlaybooks,
} from './playbooks/playbook-engine';

// ─── Cycles ────────────────────────────────────────────────────────────────

export { CycleEngine, getCycleEngine } from './cycles/cycle-engine';
export { calculateICE, rankByICE, suggestNextExperiments } from './cycles/ice-scoring';
export { buildBoard, getBoardSummary, getQuickCycles } from './cycles/cycle-board';
export type { Cycle, CycleStatus, CycleBoard, CycleVelocity, ICEScore, CycleDecision, CycleResult, CycleDecisionType } from './cycles/types';

// ─── Automation ─────────────────────────────────────────────────────────────

export { TriggerEngine, getTriggerEngine } from './automation/trigger-engine';
export { generateCLICommand, generateSchedulerCommand, generateBatchScript, generateWatchdog } from './automation/cli-generator';
export { PRESET_SCHEDULES, PRESET_TRIGGERS, PRESET_PIPELINES } from './automation/presets';
export type { Trigger, TriggerEvent, AutoAction, Schedule, AutoPipeline, PipelineStep, CLICommand, ActionType } from './automation/types';

// ─── Real Factory: Machine Departments ─────────────────────────────────────

export { BaseMachineDepartment } from './departments/base-machine-department.js';
export {
  TrendsDepartment, trendsDepartment,
  OfferDepartment, offerDepartment,
  ProductDepartment, productDepartment,
  DesignDepartment, designDepartment,
  EngineeringDepartment, engineeringDepartment,
  QADepartment, qaDepartment,
  DevOpsDepartment, devopsDepartment,
  GrowthDepartment, growthDepartment,
  ContentDepartment, contentDepartment,
  DataDepartment, dataDepartment,
  AudienceDepartment, audienceDepartment,
  CompetitiveDepartment, competitiveDepartment,
  OperationsDepartment, operationsDepartment,
  ALL_MACHINE_DEPARTMENTS,
  getMachineDepartment,
} from './departments/index.js';
export type { MachineDepartmentId } from './departments/index.js';

// ─── Real Factory: Executor Engine ─────────────────────────────────────────

export { ClaudeExecutor } from './executor/claude-executor.js';
export { FileManager } from './executor/file-manager.js';
export { PromptFactory } from './executor/prompt-factory.js';
export type { ClaudeCallOptions, ClaudeCallResult, StreamEvent, ExecutorLog } from './types/executor.js';

// ─── Real Factory: Knowledge Base ──────────────────────────────────────────

export { KnowledgeBaseEngine } from './knowledge-base/knowledge-base-engine.js';
export type {
  KnowledgeBaseEntry,
  EvaluationResult,
  PromptVersion,
  KnowledgeBaseStats,
} from './knowledge-base/types.js';

// ─── Real Factory: Pipeline (Extended) ─────────────────────────────────────

export { RealPipelineEngine, getRealPipelineEngine } from './pipeline/real-pipeline-engine.js';
export { JobValidationStage, jobValidationStage } from './pipeline/stages/job-validation.js';

// ─── Real Factory: CEO Real Commands ───────────────────────────────────────

export type { RealCEOCommand, RunDepartmentCommand, DeployProjectCommand } from './agents/ceo/ceo-real-commands.js';
export { handleRealCommand } from './agents/ceo/ceo-real-commands.js';

// ─── Real Factory: DevOps / Deploy ─────────────────────────────────────────

export { SSHClient } from './devops/ssh-client.js';
export { DockerBuilder } from './devops/docker-builder.js';
export { HealthChecker } from './devops/health-checker.js';
export { DeployPipeline } from './devops/deploy-pipeline.js';
export type { DeployResult } from './devops/deploy-pipeline.js';

// ─── Real Factory: CLI ──────────────────────────────────────────────────────

export {
  statusCommand,
  launchCommand,
  approveCommand,
  deployCommand,
  cycleCommand,
  boardCommand,
} from './cli/index.js';
