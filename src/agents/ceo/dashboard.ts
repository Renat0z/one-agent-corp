// One Agent Corp — CEO Dashboard
// Domain D-3: Aggregates status of all 6 departments + active projects in real-time snapshot

import type { DepartmentId, KPI } from '../../types/organization';
import type { ReportMessage, EscalationMessage } from '../../messaging/types';
import { organization, validateKPI } from '../../config/company-structure';
import type {
  DeptStatus,
  KPISnapshot,
  KPIHealth,
  EscalationSummary,
  ActiveProject,
  CompanyMetrics,
} from './commands';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nowIso(): string {
  return new Date().toISOString();
}

function kpiHealth(kpi: KPI, currentValue: number): KPIHealth {
  const pass = validateKPI(kpi, currentValue);
  if (!pass) return 'red';

  // Yellow: within 20% of target for time/cost KPIs, or within 80% for additive KPIs
  if (kpi.unit === 'days' || kpi.id === 'ops_burn_rate_accuracy' || kpi.id === 'ops_compliance_incidents') {
    // Lower-is-better: if within 10% of target -> yellow, else green
    const ratio = currentValue / (kpi.target === 0 ? 1 : kpi.target);
    if (ratio > 0.9 && ratio <= 1.0) return 'yellow';
    return 'green';
  }

  // Higher-is-better: if within 80% of target -> yellow
  const ratio = currentValue / kpi.target;
  if (ratio >= 0.8 && ratio < 1.0) return 'yellow';
  return 'green';
}

function aggregateHealth(snapshots: KPISnapshot[]): KPIHealth {
  if (snapshots.some(k => k.health === 'red')) return 'red';
  if (snapshots.some(k => k.health === 'yellow')) return 'yellow';
  return 'green';
}

// ─── DeptState (internal mutable state per department) ────────────────────────

interface DeptState {
  kpiValues: Record<string, number>;      // kpi.id → current value
  activeProjects: string[];
  lastReportAt: string | null;
  escalations: EscalationSummary[];
}

function emptyDeptState(): DeptState {
  return {
    kpiValues: {},
    activeProjects: [],
    lastReportAt: null,
    escalations: [],
  };
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export class Dashboard {
  /** Internal state per department — updated by incoming reports/escalations */
  private readonly state: Record<DepartmentId, DeptState>;

  /** Active projects tracked by the CEO */
  private readonly projects: Map<string, ActiveProject>;

  /** Cycle tracking state — updated via ingestCycleUpdate() */
  private cycleStats: {
    completedThisWeek: number;
    activeCycles: number;
    pendingDecisions: number;
    totalCompleted: number;
  };

  constructor() {
    const deptIds: DepartmentId[] = ['product', 'engineering', 'growth', 'sales', 'data', 'operations'];
    this.state = {} as Record<DepartmentId, DeptState>;
    for (const id of deptIds) {
      this.state[id] = emptyDeptState();
    }
    this.projects = new Map();
    this.cycleStats = {
      completedThisWeek: 0,
      activeCycles: 0,
      pendingDecisions: 0,
      totalCompleted: 0,
    };
  }

  // ── Ingestion ──────────────────────────────────────────────────────────────

  /**
   * Ingest a cycle lifecycle update — updates cycleStats accordingly.
   * Should be called by the CEO whenever a cycle changes status.
   */
  ingestCycleUpdate(update: {
    type: 'created' | 'started' | 'result' | 'decided' | 'completed';
    cycleId: string;
    decision?: 'scale' | 'adjust' | 'kill';
  }): void {
    switch (update.type) {
      case 'created':
        this.cycleStats.activeCycles += 1;
        break;
      case 'started':
        // cycle already counted on create; no additional state change needed
        break;
      case 'result':
        // Cycle produced a result — awaiting CEO decision
        this.cycleStats.pendingDecisions += 1;
        break;
      case 'decided':
        // CEO issued a decision — removes from pending
        this.cycleStats.pendingDecisions = Math.max(0, this.cycleStats.pendingDecisions - 1);
        break;
      case 'completed':
        // Cycle fully closed
        this.cycleStats.activeCycles = Math.max(0, this.cycleStats.activeCycles - 1);
        this.cycleStats.completedThisWeek += 1;
        this.cycleStats.totalCompleted += 1;
        break;
    }
  }

  /**
   * Returns velocity and rating metrics derived from cycleStats.
   */
  getCycleMetrics(): {
    velocity: number;
    rating: 'beginner' | 'good' | 'excellent';
    activeCycles: number;
    pendingDecisions: number;
  } {
    const velocity = this.cycleStats.completedThisWeek;
    let rating: 'beginner' | 'good' | 'excellent';
    if (velocity >= 9) {
      rating = 'excellent';
    } else if (velocity >= 3) {
      rating = 'good';
    } else {
      rating = 'beginner';
    }
    return {
      velocity,
      rating,
      activeCycles: this.cycleStats.activeCycles,
      pendingDecisions: this.cycleStats.pendingDecisions,
    };
  }

  /**
   * Ingest a report from a department — updates KPI values and last-report timestamp.
   * Should be called by the CEO's message handler whenever a ReportMessage arrives.
   */
  ingestReport(msg: ReportMessage): void {
    const state = this.state[msg.from];
    if (!state) return;

    state.lastReportAt = msg.created_at;
    for (const [kpiId, value] of Object.entries(msg.payload.metrics)) {
      state.kpiValues[kpiId] = value;
    }
  }

  /**
   * Ingest an escalation — adds to the pending escalations list for the department.
   */
  ingestEscalation(msg: EscalationMessage): void {
    const state = this.state[msg.from];
    if (!state) return;

    // Avoid duplicates by message ID
    const existing = state.escalations.find(e => e.messageId === msg.id);
    if (existing) return;

    state.escalations.push({
      messageId: msg.id,
      from: msg.from,
      incident: msg.payload.incident,
      severity: msg.payload.severity,
      since: msg.payload.blocker_since ?? msg.created_at,
      status: 'pending',
    });
  }

  /**
   * Mark an escalation as resolved.
   */
  resolveEscalation(messageId: string): boolean {
    for (const deptId of Object.keys(this.state) as DepartmentId[]) {
      const esc = this.state[deptId].escalations.find(e => e.messageId === messageId);
      if (esc) {
        esc.status = 'resolved';
        return true;
      }
    }
    return false;
  }

  /**
   * Register or update an active project in the dashboard.
   */
  upsertProject(project: ActiveProject): void {
    this.projects.set(project.id, { ...project });
  }

  /**
   * Update a project's stage or metrics.
   */
  updateProject(id: string, patch: Partial<Omit<ActiveProject, 'id'>>): boolean {
    const existing = this.projects.get(id);
    if (!existing) return false;
    this.projects.set(id, { ...existing, ...patch });
    return true;
  }

  /**
   * Remove a project from active tracking (e.g. on completion or kill).
   */
  removeProject(id: string): boolean {
    return this.projects.delete(id);
  }

  /**
   * Manually set a KPI value for a department (for seeding or testing).
   */
  setKpiValue(deptId: DepartmentId, kpiId: string, value: number): void {
    this.state[deptId].kpiValues[kpiId] = value;
  }

  /**
   * Add or remove a project name from a department's active project list.
   */
  setDeptActiveProjects(deptId: DepartmentId, projects: string[]): void {
    this.state[deptId].activeProjects = [...projects];
  }

  // ── Query ──────────────────────────────────────────────────────────────────

  /**
   * Returns the status snapshot for a single department.
   * Updates in <1ms since it reads from cached state.
   */
  getDeptStatus(id: DepartmentId): DeptStatus {
    const dept = organization.departments[id];
    if (!dept) {
      throw new Error(`Dashboard.getDeptStatus: unknown department '${id}'`);
    }

    const state = this.state[id];
    const kpis = dept.kpis;

    const kpiSnapshots: KPISnapshot[] = kpis.map((kpi) => {
      const currentValue = state.kpiValues[kpi.id] ?? 0;
      const health = kpiHealth(kpi, currentValue);
      return {
        id: kpi.id,
        name: kpi.name,
        currentValue,
        target: kpi.target,
        unit: kpi.unit,
        health,
        trend: 'flat',           // trend requires historical data — starts flat
        lastUpdated: state.lastReportAt ?? nowIso(),
      };
    });

    const pendingEscalations = state.escalations.filter(e => e.status !== 'resolved');

    return {
      id,
      name: dept.name,
      health: aggregateHealth(kpiSnapshots),
      kpis: kpiSnapshots,
      activeProjects: [...state.activeProjects],
      pendingEscalations,
      lastReportAt: state.lastReportAt,
      autonomyLevel: dept.autonomy_level,
    };
  }

  /**
   * Returns status snapshots for ALL 6 departments.
   * Guaranteed <100ms (pure in-memory reads).
   */
  getAllDeptStatuses(): Record<DepartmentId, DeptStatus> {
    const deptIds: DepartmentId[] = ['product', 'engineering', 'growth', 'sales', 'data', 'operations'];
    return Object.fromEntries(
      deptIds.map(id => [id, this.getDeptStatus(id)])
    ) as Record<DepartmentId, DeptStatus>;
  }

  /**
   * Returns all active projects tracked by the CEO.
   */
  getActiveProjects(): ActiveProject[] {
    return Array.from(this.projects.values());
  }

  /**
   * Returns projects waiting for CEO gate approval.
   */
  getPendingGates(): ActiveProject[] {
    return this.getActiveProjects().filter(p => p.pendingGate);
  }

  /**
   * Returns all unresolved escalations across all departments.
   */
  getAllEscalations(): EscalationSummary[] {
    const result: EscalationSummary[] = [];
    for (const deptId of Object.keys(this.state) as DepartmentId[]) {
      result.push(...this.state[deptId].escalations.filter(e => e.status !== 'resolved'));
    }
    // Sort by severity: critical > high > medium > low
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return result.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  }

  /**
   * Returns company-wide metrics aggregated from all department states.
   */
  getCompanyMetrics(): CompanyMetrics {
    const allDepts = this.getAllDeptStatuses();
    const allProjects = this.getActiveProjects();
    const allEscalations = this.getAllEscalations();

    const totalMrr = allProjects.reduce((sum, p) => sum + p.currentMrr, 0);
    const previousMrr = totalMrr * 0.92;                 // placeholder — 8% MoM assumed if no prior data
    const mrrGrowthRate = previousMrr > 0
      ? ((totalMrr - previousMrr) / previousMrr) * 100
      : 0;

    // Burn rate: sum of budget used across all active projects / avg months active
    const totalBudgetUsed = allProjects.reduce((sum, p) => sum + p.budgetUsed, 0);
    const burnRate = totalBudgetUsed > 0 ? totalBudgetUsed / Math.max(allProjects.length, 1) : 0;

    // Runway: simplified estimate — available budget / burn rate per month
    const availableBudget = allProjects.reduce((sum, p) => sum + (p.budget - p.budgetUsed), 0);
    const runway = burnRate > 0 ? Math.floor(availableBudget / burnRate) : 999;

    const pendingApprovals = allProjects.filter(p => p.pendingGate).length;
    const cycleMetrics = this.getCycleMetrics();

    return {
      totalMrr,
      mrrGrowthRate: parseFloat(mrrGrowthRate.toFixed(2)),
      activeProjects: allProjects.length,
      pendingApprovals,
      openEscalations: allEscalations.length,
      burnRate: Math.round(burnRate),
      runway,
      cycleVelocity: cycleMetrics.velocity,
      cycleVelocityRating: cycleMetrics.rating,
      activeCycles: cycleMetrics.activeCycles,
      pendingCycleDecisions: cycleMetrics.pendingDecisions,
    };
  }

  /**
   * Full snapshot: all depts + projects + company metrics + cycle metrics.
   * This is what the CEO sees at a glance.
   */
  getFullSnapshot(): {
    generatedAt: string;
    departments: Record<DepartmentId, DeptStatus>;
    projects: ActiveProject[];
    pendingGates: ActiveProject[];
    escalations: EscalationSummary[];
    metrics: CompanyMetrics;
    cycleMetrics: ReturnType<Dashboard['getCycleMetrics']>;
  } {
    return {
      generatedAt: nowIso(),
      departments: this.getAllDeptStatuses(),
      projects: this.getActiveProjects(),
      pendingGates: this.getPendingGates(),
      escalations: this.getAllEscalations(),
      metrics: this.getCompanyMetrics(),
      cycleMetrics: this.getCycleMetrics(),
    };
  }
}
