// One Agent Corp — Cycle Engine
// Domain D-7: State machine for experimentation cycles
//
// State transitions:
//   hypothesis → testing → result → scaling   → completed
//                                 → adjusting  → completed
//                                 → dead       → completed
//
// Singleton: getCycleEngine()

import type { DepartmentId } from '../types/organization';
import type {
  Cycle,
  CycleStatus,
  CycleResult,
  CycleDecision,
  CycleDecisionType,
  CycleBoard,
  CycleVelocity,
  VelocityRating,
  ICEScore,
} from './types';
import { calculateICE } from './ice-scoring';

// ─── ID Generator ─────────────────────────────────────────────────────────────

let _cycleCounter = 0;
function generateCycleId(): string {
  _cycleCounter += 1;
  const ts = Date.now().toString(36);
  const seq = _cycleCounter.toString(36).padStart(4, '0');
  return `cycle-${ts}-${seq}`;
}

// ─── Create Options ───────────────────────────────────────────────────────────

export interface CreateCycleOptions {
  projectId: string;
  hypothesis: string;
  minimumTest: string;
  targetMetric: string;
  targetValue: number;
  department: DepartmentId;
  estimatedDuration: string;
  /** ICE components — engine computes the `total` */
  ice: { impact: number; confidence: number; ease: number };
  tags?: string[];
}

// ─── Transition Errors ────────────────────────────────────────────────────────

class CycleNotFoundError extends Error {
  constructor(id: string) {
    super(`Cycle not found: ${id}`);
    this.name = 'CycleNotFoundError';
  }
}

class InvalidTransitionError extends Error {
  constructor(from: CycleStatus, to: CycleStatus, id: string) {
    super(`Invalid cycle transition for ${id}: ${from} → ${to}`);
    this.name = 'InvalidTransitionError';
  }
}

// ─── Allowed Transitions ──────────────────────────────────────────────────────

const ALLOWED_TRANSITIONS: Record<CycleStatus, CycleStatus[]> = {
  hypothesis: ['testing'],
  testing:    ['result'],
  result:     ['scaling', 'adjusting', 'dead'],
  scaling:    ['completed'],
  adjusting:  ['completed', 'testing'],  // can re-enter testing after adjustment
  dead:       ['completed'],
  completed:  [],
};

// ─── Period Helpers ───────────────────────────────────────────────────────────

/** Parse a period string into a date range for filtering.
 *  Supports ISO week ("2026-W10") and ISO month ("2026-03"). */
function periodToRange(period: string): { start: Date; end: Date } {
  const weekMatch = period.match(/^(\d{4})-W(\d{2})$/);
  if (weekMatch) {
    const year = parseInt(weekMatch[1], 10);
    const week = parseInt(weekMatch[2], 10);
    // ISO week: week 1 is the week containing the first Thursday
    const jan4 = new Date(year, 0, 4);
    const startOfW1 = new Date(jan4);
    startOfW1.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7));
    const start = new Date(startOfW1);
    start.setDate(startOfW1.getDate() + (week - 1) * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return { start, end };
  }

  const monthMatch = period.match(/^(\d{4})-(\d{2})$/);
  if (monthMatch) {
    const year = parseInt(monthMatch[1], 10);
    const month = parseInt(monthMatch[2], 10) - 1;
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 1);
    return { start, end };
  }

  throw new Error(
    `Invalid period format "${period}". Use "YYYY-Www" or "YYYY-MM".`
  );
}

function velocityRating(cyclesPerWeek: number): VelocityRating {
  if (cyclesPerWeek > 8) return 'excellent';
  if (cyclesPerWeek >= 2) return 'good';
  return 'beginner';
}

// ─── Terminal Statuses (for velocity counting) ────────────────────────────────

const TERMINAL: Set<CycleStatus> = new Set(['scaling', 'adjusting', 'dead', 'completed']);

// ─── CycleEngine ──────────────────────────────────────────────────────────────

export class CycleEngine {
  private readonly _cycles: Map<string, Cycle> = new Map();

  // ── Write Operations ────────────────────────────────────────────────────────

  /**
   * Create a new cycle in the 'hypothesis' state.
   */
  createCycle(opts: CreateCycleOptions): Cycle {
    const iceScore: ICEScore = calculateICE(
      opts.ice.impact,
      opts.ice.confidence,
      opts.ice.ease
    );

    const cycle: Cycle = {
      id: generateCycleId(),
      projectId: opts.projectId,
      hypothesis: opts.hypothesis,
      minimumTest: opts.minimumTest,
      targetMetric: opts.targetMetric,
      targetValue: opts.targetValue,
      iceScore,
      status: 'hypothesis',
      department: opts.department,
      createdAt: new Date().toISOString(),
      estimatedDuration: opts.estimatedDuration,
      tags: opts.tags,
    };

    this._cycles.set(cycle.id, cycle);
    return { ...cycle };
  }

  /**
   * Move a cycle from 'hypothesis' → 'testing'.
   */
  startTest(cycleId: string): Cycle {
    const cycle = this._get(cycleId);
    this._assertTransition(cycle, 'testing');

    const updated: Cycle = {
      ...cycle,
      status: 'testing',
      startedAt: new Date().toISOString(),
    };

    this._cycles.set(cycleId, updated);
    return { ...updated };
  }

  /**
   * Record measurement data and move cycle from 'testing' → 'result'.
   */
  recordResult(cycleId: string, result: CycleResult): Cycle {
    const cycle = this._get(cycleId);
    this._assertTransition(cycle, 'result');

    const updated: Cycle = {
      ...cycle,
      status: 'result',
      result,
      currentValue: result.metricValue,
    };

    this._cycles.set(cycleId, updated);
    return { ...updated };
  }

  /**
   * Apply a scale/adjust/kill decision.
   * Moves the cycle from 'result' → 'scaling' | 'adjusting' | 'dead'.
   */
  decide(cycleId: string, decision: CycleDecision): Cycle {
    const cycle = this._get(cycleId);

    const targetStatus = this._decisionToStatus(decision.type);
    this._assertTransition(cycle, targetStatus);

    const updated: Cycle = {
      ...cycle,
      status: targetStatus,
      decision,
    };

    this._cycles.set(cycleId, updated);
    return { ...updated };
  }

  /**
   * Mark a cycle as 'completed' (final terminal state).
   * Valid from: scaling, adjusting, dead.
   */
  completeCycle(cycleId: string): Cycle {
    const cycle = this._get(cycleId);
    this._assertTransition(cycle, 'completed');

    const updated: Cycle = {
      ...cycle,
      status: 'completed',
      completedAt: new Date().toISOString(),
    };

    this._cycles.set(cycleId, updated);
    return { ...updated };
  }

  // ── Read Operations ─────────────────────────────────────────────────────────

  /**
   * Return a kanban board grouped by status.
   * If projectId is provided, only that project's cycles are included.
   */
  getCycleBoard(projectId?: string): CycleBoard {
    const cycles = projectId
      ? this.getCyclesByProject(projectId)
      : this.getAllCycles();

    return {
      hypothesis: cycles
        .filter((c) => c.status === 'hypothesis')
        .sort((a, b) => b.iceScore.total - a.iceScore.total),
      testing: cycles.filter((c) => c.status === 'testing'),
      result: cycles.filter((c) => c.status === 'result'),
      scaling: cycles.filter((c) => c.status === 'scaling'),
      dead: cycles.filter((c) => c.status === 'dead'),
    };
  }

  /**
   * Compute cycle velocity for a given period.
   * Period format: "YYYY-Www" (ISO week) or "YYYY-MM" (month).
   */
  getVelocity(period: string): CycleVelocity {
    const { start, end } = periodToRange(period);

    // Cycles that reached a terminal state within the period
    const completed = this.getAllCycles().filter((c) => {
      if (!TERMINAL.has(c.status)) return false;
      // Use completedAt when available, otherwise startedAt as fallback
      const ts = c.completedAt ?? c.startedAt;
      if (!ts) return false;
      const d = new Date(ts);
      return d >= start && d < end;
    });

    const count = completed.length;

    // Average duration: startedAt → completedAt (in hours)
    const durationsHours = completed
      .filter((c) => c.startedAt && c.completedAt)
      .map((c) => {
        const ms =
          new Date(c.completedAt!).getTime() -
          new Date(c.startedAt!).getTime();
        return ms / (1000 * 60 * 60);
      });

    const avgDuration =
      durationsHours.length > 0
        ? durationsHours.reduce((a, b) => a + b, 0) / durationsHours.length
        : 0;

    const scaleCount = completed.filter(
      (c) => c.status === 'scaling' || c.decision?.type === 'scale'
    ).length;
    const killCount = completed.filter(
      (c) => c.status === 'dead' || c.decision?.type === 'kill'
    ).length;
    const adjustCount = completed.filter(
      (c) => c.status === 'adjusting' || c.decision?.type === 'adjust'
    ).length;

    const safe = (n: number): number => (count > 0 ? n / count : 0);

    // Period duration in weeks for velocity rating
    const periodMs = end.getTime() - start.getTime();
    const periodWeeks = periodMs / (1000 * 60 * 60 * 24 * 7);
    const cyclesPerWeek = periodWeeks > 0 ? count / periodWeeks : 0;

    return {
      period,
      completedCycles: count,
      avgCycleDuration: Math.round(avgDuration * 100) / 100,
      scaleRate: Math.round(safe(scaleCount) * 100) / 100,
      killRate: Math.round(safe(killCount) * 100) / 100,
      adjustRate: Math.round(safe(adjustCount) * 100) / 100,
      velocityRating: velocityRating(cyclesPerWeek),
    };
  }

  /**
   * All cycles that are actively being tested (status: hypothesis | testing | result).
   */
  getActiveCycles(): Cycle[] {
    const ACTIVE: Set<CycleStatus> = new Set(['hypothesis', 'testing', 'result']);
    return this.getAllCycles().filter((c) => ACTIVE.has(c.status));
  }

  getCyclesByProject(projectId: string): Cycle[] {
    return this.getAllCycles().filter((c) => c.projectId === projectId);
  }

  getCyclesByDepartment(deptId: DepartmentId): Cycle[] {
    return this.getAllCycles().filter((c) => c.department === deptId);
  }

  getAllCycles(): Cycle[] {
    return [...this._cycles.values()].map((c) => ({ ...c }));
  }

  getCycleById(id: string): Cycle | undefined {
    const c = this._cycles.get(id);
    return c ? { ...c } : undefined;
  }

  // ── Private Helpers ─────────────────────────────────────────────────────────

  private _get(id: string): Cycle {
    const cycle = this._cycles.get(id);
    if (!cycle) throw new CycleNotFoundError(id);
    return cycle;
  }

  private _assertTransition(cycle: Cycle, to: CycleStatus): void {
    const allowed = ALLOWED_TRANSITIONS[cycle.status];
    if (!allowed.includes(to)) {
      throw new InvalidTransitionError(cycle.status, to, cycle.id);
    }
  }

  private _decisionToStatus(
    type: CycleDecisionType
  ): 'scaling' | 'adjusting' | 'dead' {
    switch (type) {
      case 'scale':  return 'scaling';
      case 'adjust': return 'adjusting';
      case 'kill':   return 'dead';
    }
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

let _engine: CycleEngine | undefined;

/**
 * Return the shared CycleEngine instance.
 * Creates it on first call.
 */
export function getCycleEngine(): CycleEngine {
  if (!_engine) {
    _engine = new CycleEngine();
  }
  return _engine;
}

/**
 * Reset the singleton — useful in tests.
 * @internal
 */
export function _resetCycleEngine(): void {
  _engine = undefined;
  _cycleCounter = 0;
}
