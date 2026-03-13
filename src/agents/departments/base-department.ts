// One Agent Corp — BaseDepartment Abstract Class
// Domain D-4: Common interface for all department agents
// Pattern: Template Method — base defines flow, subclass provides domain logic

import type { Department, DepartmentId, KPI } from '../../types/organization';
import type {
  DirectiveMessage,
  ReportMessage,
  EscalationMessage,
  ReportPayload,
  EscalationPayload,
} from '../../messaging/types';
import { MessageRouter } from '../../messaging/router';
import { createReport, createEscalation } from '../../messaging/templates';
import { getDepartment, getKPIs, validateKPI } from '../../config/company-structure';

// ─── Shared Task & Report Types ───────────────────────────────────────────────

export interface Task {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  requested_at: string;
  deadline?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface TaskResult {
  task_id: string;
  status: 'success' | 'failure' | 'blocked';
  completed_at: string;
  output: Record<string, unknown>;
  notes?: string;
}

export interface Report {
  department_id: DepartmentId;
  period: string;
  summary: string;
  metrics: Record<string, number>;
  kpi_status: Record<string, { value: number; target: number; passing: boolean }>;
  blockers: string[];
  next_actions: string[];
  generated_at: string;
}

// ─── BaseDepartment ───────────────────────────────────────────────────────────

export abstract class BaseDepartment {
  protected readonly departmentId: DepartmentId;
  protected readonly config: Department;
  protected readonly kpis: KPI[];
  protected readonly router: MessageRouter;

  /** Mutable state: accumulated metrics updated as tasks complete */
  protected metrics: Record<string, number> = {};
  protected taskLog: TaskResult[] = [];
  protected directiveLog: DirectiveMessage[] = [];
  protected blockers: string[] = [];

  constructor(departmentId: DepartmentId, router: MessageRouter) {
    const config = getDepartment(departmentId);
    if (!config) {
      throw new Error(`BaseDepartment: unknown department id '${departmentId}'`);
    }
    this.departmentId = departmentId;
    this.config = config;
    this.kpis = getKPIs(departmentId);
    this.router = router;
    this.initializeMetrics();
  }

  // ── Template Method: receiveDirective ────────────────────────────────────

  /**
   * Template method: validates directive relevance, dispatches to domain logic.
   * Subclass overrides processDirective() — never overrides this method.
   */
  receiveDirective(directive: DirectiveMessage): void {
    this.directiveLog.push(directive);

    if (!this.isRelevantDirective(directive)) {
      // Non-blocking: directive not in domain scope, silently acknowledged
      return;
    }

    const task = this.directiveToTask(directive);
    const result = this.executeTask(task);
    this.taskLog.push(result);

    if (result.status === 'failure') {
      this.handleTaskFailure(task, result);
    }
  }

  // ── Abstract: must be implemented by each department ──────────────────────

  /**
   * Returns true if this directive is within the department's domain.
   * Each department recognizes its own action verbs.
   */
  protected abstract isRelevantDirective(directive: DirectiveMessage): boolean;

  /**
   * Execute a task and return the result.
   * Simulates department-specific work with timestamps and structured output.
   */
  abstract executeTask(task: Task): TaskResult;

  /**
   * Build a Report object populated with department-specific KPI values.
   */
  abstract sendReport(): Report;

  /**
   * Decide whether current state warrants escalation.
   * Called automatically after task failures; can also be called manually.
   */
  abstract escalate(reason: string): void;

  // ── Concrete: shared helpers available to all subclasses ─────────────────

  /** Convert a directive to an internal Task object */
  protected directiveToTask(directive: DirectiveMessage): Task {
    return {
      id: `task-${directive.id}`,
      type: directive.payload.action,
      payload: {
        objective: directive.payload.objective,
        deadline: directive.payload.deadline,
        resources: directive.payload.resources,
        kpi_targets: directive.payload.kpi_targets,
        context: directive.payload.context,
      },
      requested_at: directive.created_at,
      deadline: directive.payload.deadline,
      priority: 'medium',
    };
  }

  /** Post a ReportMessage to the CEO via the router */
  protected routeReport(payload: ReportPayload, subject?: string): void {
    const message: ReportMessage = createReport(
      this.departmentId,
      subject ?? `Report — ${this.departmentId} — ${payload.period}`,
      payload
    );
    this.router.route(message);
  }

  /** Post an EscalationMessage to the CEO via the router */
  protected routeEscalation(payload: EscalationPayload, subject?: string): EscalationMessage {
    const message: EscalationMessage = createEscalation(
      this.departmentId,
      subject ?? `[ESCALATION] ${payload.incident}`,
      payload
    );
    this.router.route(message);
    return message;
  }

  /** Compute KPI status map for the current metrics state */
  protected buildKpiStatus(): Record<string, { value: number; target: number; passing: boolean }> {
    const status: Record<string, { value: number; target: number; passing: boolean }> = {};
    for (const kpi of this.kpis) {
      const value = this.metrics[kpi.id] ?? 0;
      status[kpi.id] = {
        value,
        target: kpi.target,
        passing: validateKPI(kpi, value),
      };
    }
    return status;
  }

  /** Returns current ISO period string ("YYYY-WNN" by week) */
  protected currentPeriod(): string {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const week = Math.ceil(((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
    return `${now.getFullYear()}-W${String(week).padStart(2, '0')}`;
  }

  /** Default task failure handler — subclasses may override */
  protected handleTaskFailure(task: Task, result: TaskResult): void {
    this.blockers.push(`Task ${task.id} (${task.type}) failed: ${result.notes ?? 'unknown error'}`);
    if (task.priority === 'critical') {
      this.escalate(`Critical task failed: ${task.type} — ${result.notes ?? 'no details'}`);
    }
  }

  /** Seed metrics with zero-values for all known KPIs */
  private initializeMetrics(): void {
    for (const kpi of this.kpis) {
      this.metrics[kpi.id] = 0;
    }
  }

  // ── Public Getters ────────────────────────────────────────────────────────

  get id(): DepartmentId { return this.departmentId; }
  get name(): string { return this.config.name; }
  get persona() { return this.config.persona; }
  getMetrics(): Readonly<Record<string, number>> { return { ...this.metrics }; }
  getTaskLog(): readonly TaskResult[] { return [...this.taskLog]; }
  getBlockers(): readonly string[] { return [...this.blockers]; }

  /** Register this department's handler with the router */
  register(): void {
    this.router.register(this.departmentId, (message) => {
      if (message.type === 'directive') {
        this.receiveDirective(message as DirectiveMessage);
      }
    });
  }

  /** Unregister handler from router */
  unregister(): void {
    this.router.unregister(this.departmentId);
  }
}
