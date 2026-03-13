// One Agent Corp — Experimentation Cycle Types
// Domain D-7: Micro-experiments that run inside pipeline stages
// Cycle velocity is the CEO's #1 metric — maximize experiments-per-week

import type { DepartmentId } from '../types/organization';

// ─── Status Flow ─────────────────────────────────────────────────────────────
// hypothesis → testing → result → scaling | adjusting | dead → completed

export type CycleStatus =
  | 'hypothesis'  // idea queued, ready to test
  | 'testing'     // test is live / running
  | 'result'      // data collected, awaiting decision
  | 'scaling'     // worked — investing more
  | 'adjusting'   // partial signal — pivoting and re-testing
  | 'dead'        // no signal — archived
  | 'completed';  // fully closed (scaled or killed)

// ─── ICE Score ────────────────────────────────────────────────────────────────

export interface ICEScore {
  /** 1-10: if it works, how much does it move the needle? */
  impact: number;
  /** 1-10: how likely is this to work? */
  confidence: number;
  /** 1-10: how fast / cheap is it to run the test? */
  ease: number;
  /** (impact + confidence + ease) / 3 — computed, never set manually */
  total: number;
}

// ─── Cycle Result ─────────────────────────────────────────────────────────────

export interface CycleResult {
  /** Actual measured value of the target metric */
  metricValue: number;
  /** What the data says — no opinions, pure observation */
  summary: string;
  /** ISO-8601 timestamp when measurement was taken */
  measuredAt: string;
  /** Where data came from: "Mixpanel", "Stripe", "manual", etc. */
  dataSource?: string;
}

// ─── Cycle Decision ───────────────────────────────────────────────────────────

export type CycleDecisionType = 'scale' | 'adjust' | 'kill';

export interface CycleDecision {
  type: CycleDecisionType;
  /** Why this decision was made */
  reason: string;
  /** Who made the call */
  decidedBy: 'ceo' | DepartmentId;
  /** ISO-8601 timestamp */
  decidedAt: string;
  /** Concrete next steps following the decision */
  nextActions?: string[];
}

// ─── Cycle ────────────────────────────────────────────────────────────────────

export interface Cycle {
  id: string;
  /** Pipeline project this cycle belongs to */
  projectId: string;
  /** Classic hypothesis format: "If I do X, metric Y will change by Z%" */
  hypothesis: string;
  /** The smallest possible test that proves or refutes the hypothesis */
  minimumTest: string;
  /** Which metric we're watching (e.g. "conversion_rate", "activation_d1") */
  targetMetric: string;
  /** The value we expect to reach / beat */
  targetValue: number;
  /** Measured value — populated after recordResult() */
  currentValue?: number;
  iceScore: ICEScore;
  status: CycleStatus;
  /** Department that owns and runs this experiment */
  department: DepartmentId;
  /** ISO-8601 */
  createdAt: string;
  /** ISO-8601 — when testing actually started */
  startedAt?: string;
  /** ISO-8601 — when cycle reached a terminal state */
  completedAt?: string;
  /** Human-readable: "15min", "2h", "3d", "1w" */
  estimatedDuration: string;
  decision?: CycleDecision;
  result?: CycleResult;
  tags?: string[];
}

// ─── Cycle Board ──────────────────────────────────────────────────────────────
// Kanban view of all cycles grouped by status

export interface CycleBoard {
  /** Hypotheses ready to be tested — ordered by ICE score desc */
  hypothesis: Cycle[];
  /** Tests currently running */
  testing: Cycle[];
  /** Results received, waiting for a scale/adjust/kill decision */
  result: Cycle[];
  /** Scaled experiments receiving more investment */
  scaling: Cycle[];
  /** Killed experiments — historical archive */
  dead: Cycle[];
}

// ─── Cycle Velocity ───────────────────────────────────────────────────────────
// CEO KPI #1: how many experiments are we completing per period?

export type VelocityRating =
  | 'beginner'    // < 2 completed cycles / week
  | 'good'        // 2-8 completed cycles / week
  | 'excellent';  // > 8 completed cycles / week (3+ per day)

export interface CycleVelocity {
  /** "2026-W10" (ISO week) or "2026-03" (month) */
  period: string;
  /** Total cycles that reached a terminal status in the period */
  completedCycles: number;
  /** Average time from startedAt → completedAt, in hours */
  avgCycleDuration: number;
  /** Fraction of completed cycles that went to "scale" or "scaling" */
  scaleRate: number;
  /** Fraction of completed cycles that went to "dead" */
  killRate: number;
  /** Fraction of completed cycles that went to "adjusting" */
  adjustRate: number;
  velocityRating: VelocityRating;
}
