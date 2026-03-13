// One Agent Corp — CEO Agent
// Domain D-3: Central command point — receives reports, emits directives, approves/rejects

import type { DepartmentId } from '../../types/organization';
import type {
  Message,
  DirectiveMessage,
  ReportMessage,
  EscalationMessage,
  RequestMessage,
  RoutingResult,
} from '../../messaging/types';
import { MessageRouter, getGlobalRouter } from '../../messaging/router';
import { createDirective, broadcastDirective } from '../../messaging/templates';
import { organization, getAllDepartmentIds } from '../../config/company-structure';

import { Dashboard } from './dashboard';
import { DecisionEngine, DEFAULT_DECISION_CONTEXT, type DecisionContext } from './decision-engine';
import type {
  CEOCommand,
  CommandResult,
  LaunchCommand,
  ApprovalCommand,
  RejectCommand,
  EscalateCommand,
  StatusCommand,
  BroadcastCommand,
  ActiveProject,
  DeptStatus,
  DispatchResult,
} from './commands';
import type { DecisionResult } from './decision-engine';

// ─── Inbox Types ──────────────────────────────────────────────────────────────

interface InboxEntry {
  message: Message;
  receivedAt: string;
  processed: boolean;
}

// ─── CEO Agent ────────────────────────────────────────────────────────────────

export class CEOAgent {
  readonly id = 'ceo' as const;
  private readonly dashboard: Dashboard;
  private readonly decisionEngine: DecisionEngine;
  private readonly router: MessageRouter;
  private readonly inbox: InboxEntry[] = [];

  constructor(opts?: {
    router?: MessageRouter;
    decisionContext?: Partial<DecisionContext>;
  }) {
    this.router = opts?.router ?? getGlobalRouter();
    this.dashboard = new Dashboard();
    this.decisionEngine = new DecisionEngine({
      ...DEFAULT_DECISION_CONTEXT,
      ...(opts?.decisionContext ?? {}),
    });

    // Register CEO as a handler for inbound messages
    this._registerHandler();
  }

  // ── Handler Registration ───────────────────────────────────────────────────

  private _registerHandler(): void {
    // Avoid double-registration in hot-reload scenarios
    if (this.router.hasHandler('ceo')) {
      this.router.unregister('ceo');
    }
    this.router.register('ceo', (msg: Message) => this._receive(msg));
  }

  private _receive(msg: Message): void {
    this.inbox.push({ message: msg, receivedAt: new Date().toISOString(), processed: false });

    switch (msg.type) {
      case 'report':
        this.dashboard.ingestReport(msg as ReportMessage);
        break;
      case 'escalation':
        this.dashboard.ingestEscalation(msg as EscalationMessage);
        // Auto-update decision context with current escalation count
        this.decisionEngine.updateContext({
          openEscalations: this.dashboard.getAllEscalations().length,
        });
        break;
      case 'request':
      case 'directive':
        // Directives addressed to CEO are unusual — log, don't process
        break;
    }
  }

  // ── Command Execution ──────────────────────────────────────────────────────

  /**
   * Main entry point: execute any CEO command and return a typed result.
   */
  execute(command: CEOCommand): CommandResult {
    switch (command.kind) {
      case 'launch-project': return this.launchProject(command);
      case 'approve':        return this.approve(command);
      case 'reject':         return this.reject(command);
      case 'escalate':       return this.escalate(command);
      case 'status':         return this.status(command);
      case 'broadcast':      return this.broadcast(command);
      default: return { status: 'error', command: (command as CEOCommand).kind, timestamp: new Date().toISOString(), reason: `Unknown command kind: ${(command as CEOCommand).kind}` };
    }
  }

  // ── launch-project ─────────────────────────────────────────────────────────

  launchProject(cmd: LaunchCommand): CommandResult<{ projectId: string; decision: string; dispatches: RoutingResult[] }> {
    const decisionResult = this.decisionEngine.evaluateLaunch(cmd);

    if (decisionResult.decision === 'reject') {
      return {
        status: 'rejected',
        command: 'launch-project',
        timestamp: new Date().toISOString(),
        reason: decisionResult.summary,
        data: { projectId: '', decision: 'reject', dispatches: [] },
      };
    }

    if (decisionResult.decision === 'request-changes') {
      return {
        status: 'pending',
        command: 'launch-project',
        timestamp: new Date().toISOString(),
        reason: decisionResult.summary,
        data: {
          projectId: '',
          decision: 'request-changes',
          dispatches: [],
        },
      };
    }

    // Approved — create project record and dispatch directives
    const projectId = `proj-${Date.now().toString(36)}`;
    const project: ActiveProject = {
      id: projectId,
      name: cmd.projectName,
      stage: 'ideation',
      health: 'green',
      budget: cmd.budget,
      budgetUsed: 0,
      targetMrr: cmd.targetMrr,
      currentMrr: 0,
      departments: cmd.departments,
      startedAt: new Date().toISOString(),
      targetDeadline: cmd.timeline,
      pendingGate: false,
    };
    this.dashboard.upsertProject(project);

    // Update decision engine context
    this.decisionEngine.updateContext({
      availableBudget: this.decisionEngine.getContext().availableBudget - cmd.budget,
      activeProjects: this.decisionEngine.getContext().activeProjects + 1,
    });

    // Notify involved departments with a directive
    const dispatches: RoutingResult[] = [];
    if (cmd.departments.length > 0) {
      const directive = createDirective(
        cmd.departments,
        `Project Launch: ${cmd.projectName}`,
        {
          action: 'initialize_project',
          objective: cmd.description,
          deadline: cmd.timeline,
          resources: [`budget:$${cmd.budget}`, `project-id:${projectId}`],
          kpi_targets: { target_mrr: cmd.targetMrr },
          context: {
            projectId,
            projectName: cmd.projectName,
            riskLevel: cmd.riskLevel,
            priority: cmd.priority,
            strategicAlignment: cmd.strategicAlignment,
            decisionScore: decisionResult.score,
            approvalConditions: decisionResult.conditions,
          },
        }
      );
      dispatches.push(this.router.route(directive));
    }

    return {
      status: 'approved',
      command: 'launch-project',
      timestamp: new Date().toISOString(),
      data: { projectId, decision: 'approve', dispatches },
    };
  }

  // ── approve ────────────────────────────────────────────────────────────────

  approve(cmd: ApprovalCommand): CommandResult<DecisionResult & { routing?: RoutingResult }> {
    const result = this.decisionEngine.evaluateApproval(cmd);

    if (result.status === 'rejected') {
      return result;
    }

    // Send approval directive back to the originating department if we can infer it
    const originMsg = this._findMessageById(cmd.proposalId);
    const dispatches: RoutingResult[] = [];

    if (originMsg && (originMsg.type === 'request' || originMsg.type === 'escalation')) {
      const from = (originMsg as RequestMessage | EscalationMessage).from;
      const directive = createDirective(
        from,
        `Approved: ${originMsg.subject}`,
        {
          action: 'proceed',
          objective: `CEO approved your request (${cmd.proposalId})`,
          resources: cmd.allocatedBudget !== undefined
            ? [`budget:$${cmd.allocatedBudget}`]
            : undefined,
          context: {
            correlationId: cmd.proposalId,
            conditions: cmd.conditions ?? [],
            reason: cmd.reason ?? 'Approved by CEO',
          },
        },
        { correlation_id: cmd.proposalId }
      );
      dispatches.push(this.router.route(directive));

      // Mark original message as processed
      const inbox = this.inbox.find(e => e.message.id === cmd.proposalId);
      if (inbox) inbox.processed = true;

      // If escalation, resolve it in dashboard
      if (originMsg.type === 'escalation') {
        this.dashboard.resolveEscalation(cmd.proposalId);
        this.decisionEngine.updateContext({
          openEscalations: Math.max(0, this.decisionEngine.getContext().openEscalations - 1),
        });
      }
    }

    return {
      ...result,
      routing: dispatches[0],
    };
  }

  // ── reject ─────────────────────────────────────────────────────────────────

  reject(cmd: RejectCommand): CommandResult<DecisionResult & { routing?: RoutingResult }> {
    const result = this.decisionEngine.evaluateRejection(cmd);

    // Notify the originating department
    const originMsg = this._findMessageById(cmd.proposalId);
    const dispatches: RoutingResult[] = [];

    if (originMsg && (originMsg.type === 'request' || originMsg.type === 'escalation')) {
      const from = (originMsg as RequestMessage | EscalationMessage).from;
      const directive = createDirective(
        from,
        `Rejected: ${originMsg.subject}`,
        {
          action: 'halt',
          objective: `CEO rejected your request (${cmd.proposalId})`,
          context: {
            correlationId: cmd.proposalId,
            reason: cmd.reason,
            feedback: cmd.feedback ?? '',
            canResubmit: cmd.canResubmit,
          },
        },
        { correlation_id: cmd.proposalId }
      );
      dispatches.push(this.router.route(directive));

      const inbox = this.inbox.find(e => e.message.id === cmd.proposalId);
      if (inbox) inbox.processed = true;
    }

    return {
      ...result,
      routing: dispatches[0],
    };
  }

  // ── escalate ───────────────────────────────────────────────────────────────

  escalate(cmd: EscalateCommand): CommandResult<{ dispatches: RoutingResult[] }> {
    const directive = createDirective(
      cmd.targetDepartment,
      `CEO Escalation: ${cmd.issue}`,
      {
        action: 'resolve_escalation',
        objective: cmd.requiredResolution,
        deadline: cmd.deadline,
        context: {
          urgency: cmd.urgency,
          issue: cmd.issue,
          escalatedByCeo: true,
        },
      },
      { tags: ['escalation', `urgency:${cmd.urgency}`] }
    );

    const routing = this.router.route(directive);

    return {
      status: 'executed',
      command: 'escalate',
      timestamp: new Date().toISOString(),
      data: { dispatches: [routing] },
      routing,
    };
  }

  // ── status ─────────────────────────────────────────────────────────────────

  status(cmd: StatusCommand): CommandResult<{
    departments?: Record<string, DeptStatus>;
    projects?: ActiveProject[];
    snapshot?: ReturnType<Dashboard['getFullSnapshot']>;
  }> {
    if (cmd.scope === 'all') {
      return {
        status: 'executed',
        command: 'status',
        timestamp: new Date().toISOString(),
        data: { snapshot: this.dashboard.getFullSnapshot() },
      };
    }

    if (cmd.scope === 'projects') {
      return {
        status: 'executed',
        command: 'status',
        timestamp: new Date().toISOString(),
        data: { projects: this.dashboard.getActiveProjects() },
      };
    }

    // Single department
    const deptStatus = this.dashboard.getDeptStatus(cmd.scope);
    return {
      status: 'executed',
      command: 'status',
      timestamp: new Date().toISOString(),
      data: { departments: { [cmd.scope]: deptStatus } },
    };
  }

  // ── broadcast ──────────────────────────────────────────────────────────────

  broadcast(cmd: BroadcastCommand): CommandResult<{ dispatches: RoutingResult[] }> {
    const targets: DepartmentId[] = cmd.targetDepartments ?? getAllDepartmentIds();

    let directive: DirectiveMessage;

    if (cmd.targetDepartments !== undefined) {
      // Targeted broadcast (subset of departments)
      directive = createDirective(
        targets,
        `[BROADCAST] ${cmd.action}`,
        {
          action: cmd.action,
          objective: cmd.objective,
          deadline: cmd.deadline,
          context: { ...(cmd.context ?? {}), broadcast: true },
        },
        { tags: ['broadcast'] }
      );
    } else {
      // Use template for full broadcast
      directive = broadcastDirective({
        action: cmd.action,
        objective: cmd.objective,
        deadline: cmd.deadline,
        context: cmd.context,
      });
    }

    const routing = this.router.route(directive);

    return {
      status: 'executed',
      command: 'broadcast',
      timestamp: new Date().toISOString(),
      data: { dispatches: [routing] },
      routing,
    };
  }

  // ── Direct Helpers ────────────────────────────────────────────────────────

  /**
   * Send a one-off directive to a specific department or set of departments.
   */
  sendDirective(opts: {
    to: DepartmentId | DepartmentId[];
    subject: string;
    action: string;
    objective: string;
    deadline?: string;
    resources?: string[];
    kpiTargets?: Record<string, number>;
    context?: Record<string, unknown>;
    correlationId?: string;
  }): DispatchResult {
    const msg = createDirective(
      opts.to,
      opts.subject,
      {
        action: opts.action,
        objective: opts.objective,
        deadline: opts.deadline,
        resources: opts.resources,
        kpi_targets: opts.kpiTargets,
        context: opts.context,
      },
      opts.correlationId ? { correlation_id: opts.correlationId } : undefined
    );

    return {
      message: msg,
      routing: this.router.route(msg),
    };
  }

  // ── Dashboard & Context Accessors ─────────────────────────────────────────

  getDashboard(): Dashboard {
    return this.dashboard;
  }

  getDecisionEngine(): DecisionEngine {
    return this.decisionEngine;
  }

  /**
   * Returns all unprocessed messages in the CEO inbox, sorted by priority.
   */
  getUnprocessedMessages(): Message[] {
    return this.inbox
      .filter(e => !e.processed)
      .map(e => e.message)
      .sort((a, b) => a.priority - b.priority);
  }

  /**
   * Mark a message as processed (after manual review or action).
   */
  markProcessed(messageId: string): boolean {
    const entry = this.inbox.find(e => e.message.id === messageId);
    if (!entry) return false;
    entry.processed = true;
    return true;
  }

  /**
   * Returns the full inbox — processed and unprocessed — for auditing.
   */
  getInbox(): ReadonlyArray<InboxEntry> {
    return this.inbox;
  }

  // ── Private Utilities ─────────────────────────────────────────────────────

  private _findMessageById(id: string): Message | undefined {
    return this.inbox.find(e => e.message.id === id || e.message.correlation_id === id)?.message;
  }
}

// ─── Singleton Factory ────────────────────────────────────────────────────────

let _ceoInstance: CEOAgent | null = null;

/**
 * Returns the global CEO agent instance (lazy-init singleton).
 * Reuses the global router from D-2.
 */
export function getCEOAgent(opts?: {
  router?: MessageRouter;
  decisionContext?: Partial<DecisionContext>;
}): CEOAgent {
  if (!_ceoInstance) {
    _ceoInstance = new CEOAgent(opts);
  }
  return _ceoInstance;
}

/** Replace the global CEO instance — useful in tests */
export function setCEOAgent(agent: CEOAgent): void {
  _ceoInstance = agent;
}

/** Reset global state — useful in tests */
export function resetCEOAgent(): void {
  _ceoInstance = null;
}

// ─── Re-exports for consumers ─────────────────────────────────────────────────

export { Dashboard } from './dashboard';
export { DecisionEngine, DEFAULT_DECISION_CONTEXT } from './decision-engine';
export type { DecisionContext, DecisionResult, DecisionCriteria } from './decision-engine';
