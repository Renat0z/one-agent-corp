// One Agent Corp — CEO Decision Engine
// Domain D-3: Rule-based engine to approve/reject proposals with measurable criteria

import type { LaunchCommand, ApprovalCommand, RejectCommand, CommandResult, KPIHealth } from './commands';

// ─── Thresholds (configurable constants) ──────────────────────────────────────

const THRESHOLDS = {
  /** Minimum expected MRR return as multiple of budget (ROI floor) */
  MIN_ROI_MULTIPLE: 3,

  /** Maximum budget for auto-approve without extra scrutiny (USD) */
  AUTO_APPROVE_BUDGET_LIMIT: 25_000,

  /** Budget ceiling — above this always requires manual justification */
  HARD_BUDGET_CEILING: 200_000,

  /** Minimum required team size (departments involved) for a project */
  MIN_DEPARTMENTS: 2,

  /** Risk multiplier: high-risk projects require ROI_MULTIPLE * this */
  HIGH_RISK_ROI_MULTIPLIER: 1.5,

  /** Minimum MRR target to be worth launching */
  MIN_MRR_TARGET: 1_000,

  /** Maximum open escalations before new projects are blocked */
  MAX_OPEN_ESCALATIONS: 3,
} as const;

// ─── Criteria Types ───────────────────────────────────────────────────────────

export interface DecisionCriteria {
  id: string;
  name: string;
  pass: boolean;
  value: string | number;
  threshold: string | number;
  weight: 'blocking' | 'major' | 'minor';
}

export interface DecisionResult {
  decision: 'approve' | 'reject' | 'request-changes';
  score: number;                  // 0-100
  criteria: DecisionCriteria[];
  summary: string;
  conditions?: string[];          // If 'approve', any conditions attached
  requiredChanges?: string[];     // If 'request-changes'
}

// ─── Context the engine uses to evaluate ─────────────────────────────────────

export interface DecisionContext {
  availableBudget: number;        // Company liquid budget available (USD)
  openEscalations: number;        // Number of currently unresolved escalations
  activeProjects: number;         // Number of in-flight projects
  companyMrr: number;             // Current total MRR (USD)
  strategicPriorities: string[];  // E.g. ["growth", "retention", "infra"]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function roiMultiple(budget: number, targetMrr: number): number {
  if (budget === 0) return 0;
  // Annualized return / budget
  return (targetMrr * 12) / budget;
}

function kpiHealthFromScore(score: number): KPIHealth {
  if (score >= 70) return 'green';
  if (score >= 40) return 'yellow';
  return 'red';
}

// ─── Core Decision Engine ─────────────────────────────────────────────────────

export class DecisionEngine {
  private context: DecisionContext;

  constructor(context: DecisionContext) {
    this.context = context;
  }

  /** Update the engine's decision context (e.g. after a report comes in) */
  updateContext(patch: Partial<DecisionContext>): void {
    this.context = { ...this.context, ...patch };
  }

  getContext(): Readonly<DecisionContext> {
    return this.context;
  }

  // ── Project Launch Evaluation ──────────────────────────────────────────────

  evaluateLaunch(cmd: LaunchCommand): DecisionResult {
    const criteria: DecisionCriteria[] = [];

    // [1] BLOCKING — Budget availability
    const budgetAvailable = cmd.budget <= this.context.availableBudget;
    criteria.push({
      id: 'budget_available',
      name: 'Budget Available',
      pass: budgetAvailable,
      value: cmd.budget,
      threshold: this.context.availableBudget,
      weight: 'blocking',
    });

    // [2] BLOCKING — Budget ceiling hard stop
    const underCeiling = cmd.budget <= THRESHOLDS.HARD_BUDGET_CEILING;
    criteria.push({
      id: 'budget_ceiling',
      name: 'Budget Under Hard Ceiling',
      pass: underCeiling,
      value: cmd.budget,
      threshold: THRESHOLDS.HARD_BUDGET_CEILING,
      weight: 'blocking',
    });

    // [3] MAJOR — ROI multiple (annualized MRR vs budget)
    const roi = roiMultiple(cmd.budget, cmd.targetMrr);
    const roiThreshold = cmd.riskLevel === 'high'
      ? THRESHOLDS.MIN_ROI_MULTIPLE * THRESHOLDS.HIGH_RISK_ROI_MULTIPLIER
      : THRESHOLDS.MIN_ROI_MULTIPLE;
    const roiPass = roi >= roiThreshold;
    criteria.push({
      id: 'roi_multiple',
      name: 'ROI Multiple (12-month MRR / Budget)',
      pass: roiPass,
      value: parseFloat(roi.toFixed(2)),
      threshold: roiThreshold,
      weight: 'major',
    });

    // [4] MAJOR — Minimum MRR target
    const mrrPass = cmd.targetMrr >= THRESHOLDS.MIN_MRR_TARGET;
    criteria.push({
      id: 'mrr_target',
      name: 'Minimum MRR Target',
      pass: mrrPass,
      value: cmd.targetMrr,
      threshold: THRESHOLDS.MIN_MRR_TARGET,
      weight: 'major',
    });

    // [5] MAJOR — Minimum departments involved
    const deptPass = cmd.departments.length >= THRESHOLDS.MIN_DEPARTMENTS;
    criteria.push({
      id: 'departments_coverage',
      name: 'Minimum Departments Involved',
      pass: deptPass,
      value: cmd.departments.length,
      threshold: THRESHOLDS.MIN_DEPARTMENTS,
      weight: 'major',
    });

    // [6] MINOR — Strategic alignment provided (non-empty)
    const alignmentPass = cmd.strategicAlignment.trim().length > 10;
    criteria.push({
      id: 'strategic_alignment',
      name: 'Strategic Alignment Stated',
      pass: alignmentPass,
      value: cmd.strategicAlignment.length > 0 ? 'provided' : 'missing',
      threshold: 'non-empty',
      weight: 'minor',
    });

    // [7] MINOR — Open escalations check
    const escalationsOk = this.context.openEscalations < THRESHOLDS.MAX_OPEN_ESCALATIONS;
    criteria.push({
      id: 'open_escalations',
      name: 'Open Escalations Below Threshold',
      pass: escalationsOk,
      value: this.context.openEscalations,
      threshold: THRESHOLDS.MAX_OPEN_ESCALATIONS,
      weight: 'minor',
    });

    return this._buildResult(criteria, cmd.budget);
  }

  // ── Budget Request Evaluation ──────────────────────────────────────────────

  evaluateBudgetRequest(opts: {
    proposalId: string;
    amount: number;
    department: string;
    justification: string;
    deadline?: string;
  }): DecisionResult {
    const criteria: DecisionCriteria[] = [];

    // [1] BLOCKING — Amount fits available budget
    const fits = opts.amount <= this.context.availableBudget;
    criteria.push({
      id: 'budget_fits',
      name: 'Amount Fits Available Budget',
      pass: fits,
      value: opts.amount,
      threshold: this.context.availableBudget,
      weight: 'blocking',
    });

    // [2] MAJOR — Amount doesn't exceed 20% of available budget (concentration risk)
    const concentrationLimit = this.context.availableBudget * 0.20;
    const noConcentration = opts.amount <= concentrationLimit;
    criteria.push({
      id: 'concentration_risk',
      name: 'Amount ≤ 20% of Available Budget',
      pass: noConcentration,
      value: opts.amount,
      threshold: Math.round(concentrationLimit),
      weight: 'major',
    });

    // [3] MAJOR — Justification provided
    const justificationOk = opts.justification.trim().length >= 20;
    criteria.push({
      id: 'justification',
      name: 'Justification Adequate',
      pass: justificationOk,
      value: opts.justification.length,
      threshold: 20,
      weight: 'major',
    });

    // [4] MINOR — Auto-approve ceiling
    const autoApprove = opts.amount <= THRESHOLDS.AUTO_APPROVE_BUDGET_LIMIT;
    criteria.push({
      id: 'auto_approve_ceiling',
      name: 'Under Auto-Approve Ceiling',
      pass: autoApprove,
      value: opts.amount,
      threshold: THRESHOLDS.AUTO_APPROVE_BUDGET_LIMIT,
      weight: 'minor',
    });

    return this._buildResult(criteria, opts.amount);
  }

  // ── Approval Command Evaluation ────────────────────────────────────────────

  evaluateApproval(cmd: ApprovalCommand): CommandResult<DecisionResult> {
    const conditions: string[] = cmd.conditions ?? [];

    if (cmd.allocatedBudget !== undefined && cmd.allocatedBudget > this.context.availableBudget) {
      return {
        status: 'rejected',
        command: 'approve',
        timestamp: new Date().toISOString(),
        reason: `Allocated budget $${cmd.allocatedBudget} exceeds available $${this.context.availableBudget}`,
      };
    }

    // [2] MAJOR — Budget headroom: allocated budget must not exceed 50% of available budget
    const budgetHeadroomPass = cmd.allocatedBudget === undefined
      || cmd.allocatedBudget <= this.context.availableBudget * 0.5;

    // [3] MINOR — Active project load: avoid approving when already overwhelmed (>5 active projects)
    const projectLoadPass = this.context.activeProjects <= 5;

    const result: DecisionResult = {
      decision: 'approve',
      score: 100,
      criteria: [
        {
          id: 'manual_approval',
          name: 'CEO Manual Approval',
          pass: true,
          value: cmd.proposalId,
          threshold: 'manual',
          weight: 'blocking',
        },
        {
          id: 'budget_headroom',
          name: 'Allocated Budget ≤ 50% of Available Budget',
          pass: budgetHeadroomPass,
          value: cmd.allocatedBudget ?? 0,
          threshold: Math.round(this.context.availableBudget * 0.5),
          weight: 'major',
        },
        {
          id: 'project_load',
          name: 'Active Project Load ≤ 5',
          pass: projectLoadPass,
          value: this.context.activeProjects,
          threshold: 5,
          weight: 'minor',
        },
      ],
      summary: `CEO manually approved proposal ${cmd.proposalId}. Reason: ${cmd.reason ?? 'none stated'}`,
      conditions: conditions.length > 0 ? conditions : undefined,
    };

    return {
      status: 'approved',
      command: 'approve',
      timestamp: new Date().toISOString(),
      data: result,
    };
  }

  // ── Reject Command Evaluation ──────────────────────────────────────────────

  evaluateRejection(cmd: RejectCommand): CommandResult<DecisionResult> {
    // [2] MAJOR — Open escalations risk: rejection is reinforced when escalations are high
    const escalationRiskPass = this.context.openEscalations < THRESHOLDS.MAX_OPEN_ESCALATIONS;

    // [3] MINOR — Reason adequacy: a non-trivial rejection reason should be provided
    const reasonAdequatePass = cmd.reason.trim().length >= 10;

    const result: DecisionResult = {
      decision: 'reject',
      score: 0,
      criteria: [
        {
          id: 'manual_rejection',
          name: 'CEO Manual Rejection',
          pass: false,
          value: cmd.proposalId,
          threshold: 'manual',
          weight: 'blocking',
        },
        {
          id: 'escalation_risk',
          name: 'Open Escalations Below Threshold',
          pass: escalationRiskPass,
          value: this.context.openEscalations,
          threshold: THRESHOLDS.MAX_OPEN_ESCALATIONS,
          weight: 'major',
        },
        {
          id: 'rejection_reason_adequacy',
          name: 'Rejection Reason Adequately Stated',
          pass: reasonAdequatePass,
          value: cmd.reason.trim().length,
          threshold: 10,
          weight: 'minor',
        },
      ],
      summary: `CEO rejected proposal ${cmd.proposalId}. Reason: ${cmd.reason}`,
      requiredChanges: cmd.feedback && cmd.canResubmit ? [cmd.feedback] : undefined,
    };

    return {
      status: 'rejected',
      command: 'reject',
      timestamp: new Date().toISOString(),
      data: result,
      reason: cmd.reason,
    };
  }

  // ── Private Scoring Logic ─────────────────────────────────────────────────

  private _buildResult(criteria: DecisionCriteria[], budget: number): DecisionResult {
    const blockingFails = criteria.filter(c => c.weight === 'blocking' && !c.pass);
    const majorFails = criteria.filter(c => c.weight === 'major' && !c.pass);
    const minorFails = criteria.filter(c => c.weight === 'minor' && !c.pass);

    // Blocking fail → immediate reject
    if (blockingFails.length > 0) {
      const reasons = blockingFails.map(c => c.name).join(', ');
      return {
        decision: 'reject',
        score: 0,
        criteria,
        summary: `Rejected — blocking criteria failed: ${reasons}`,
      };
    }

    // Score: blocking=40pts each, major=25pts each, minor=10pts each
    const totalPossible =
      criteria.filter(c => c.weight === 'blocking').length * 40 +
      criteria.filter(c => c.weight === 'major').length * 25 +
      criteria.filter(c => c.weight === 'minor').length * 10;

    const scored =
      criteria.filter(c => c.weight === 'blocking' && c.pass).length * 40 +
      criteria.filter(c => c.weight === 'major' && c.pass).length * 25 +
      criteria.filter(c => c.weight === 'minor' && c.pass).length * 10;

    const score = totalPossible > 0 ? Math.round((scored / totalPossible) * 100) : 0;

    if (majorFails.length >= 2) {
      const reasons = majorFails.map(c => c.name).join(', ');
      return {
        decision: 'request-changes',
        score,
        criteria,
        summary: `Request changes — multiple major criteria failed (score: ${score}/100): ${reasons}`,
        requiredChanges: majorFails.map(c => `Improve "${c.name}": current=${c.value}, required=${c.threshold}`),
      };
    }

    if (majorFails.length === 1) {
      return {
        decision: 'request-changes',
        score,
        criteria,
        summary: `Request changes — major criterion "${majorFails[0].name}" failed (score: ${score}/100)`,
        requiredChanges: [`Improve "${majorFails[0].name}": current=${majorFails[0].value}, required=${majorFails[0].threshold}`],
      };
    }

    // All blocking + major pass
    const conditions: string[] = [];
    if (budget > THRESHOLDS.AUTO_APPROVE_BUDGET_LIMIT) {
      conditions.push(`High-budget project ($${budget.toLocaleString()}) — require weekly status reports`);
    }
    if (minorFails.length > 0) {
      conditions.push(`Minor issues noted: ${minorFails.map(c => c.name).join(', ')}`);
    }

    return {
      decision: 'approve',
      score,
      criteria,
      summary: `Approved — score ${score}/100. ${conditions.length > 0 ? 'With conditions.' : 'No conditions.'}`,
      conditions: conditions.length > 0 ? conditions : undefined,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createDecisionEngine(context: DecisionContext): DecisionEngine {
  return new DecisionEngine(context);
}

/** Default context for a bootstrapping company */
export const DEFAULT_DECISION_CONTEXT: DecisionContext = {
  availableBudget: 100_000,
  openEscalations: 0,
  activeProjects: 0,
  companyMrr: 0,
  strategicPriorities: ['growth', 'mvp-speed', 'cost-efficiency'],
};
