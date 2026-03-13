// One Agent Corp — Cycle Board
// Domain D-7: Aggregation and display helpers for the CEO dashboard
//
// The board is a pure view layer — it does not mutate state.
// Feed it cycles from CycleEngine and it returns structured or formatted output.

import type { Cycle, CycleBoard } from './types';

// ─── Duration Parsing ─────────────────────────────────────────────────────────

/**
 * Convert an estimatedDuration string to hours.
 *
 * Supports: "15min", "30min", "1h", "2h", "3d", "1w"
 * Returns Infinity for unknown formats so they are always excluded from quick cycles.
 */
function durationToHours(duration: string): number {
  const minMatch = duration.match(/^(\d+(?:\.\d+)?)min$/i);
  if (minMatch) return parseFloat(minMatch[1]) / 60;

  const hourMatch = duration.match(/^(\d+(?:\.\d+)?)h$/i);
  if (hourMatch) return parseFloat(hourMatch[1]);

  const dayMatch = duration.match(/^(\d+(?:\.\d+)?)d$/i);
  if (dayMatch) return parseFloat(dayMatch[1]) * 24;

  const weekMatch = duration.match(/^(\d+(?:\.\d+)?)w$/i);
  if (weekMatch) return parseFloat(weekMatch[1]) * 24 * 7;

  return Infinity;
}

// ─── Board Builder ────────────────────────────────────────────────────────────

/**
 * Build a CycleBoard from a flat list of cycles.
 *
 * - hypothesis column is sorted by ICE score desc (highest priority first)
 * - testing column is sorted by startedAt asc (oldest first — most urgent)
 * - result column is sorted by result.measuredAt asc (waiting longest first)
 * - scaling column is sorted by decision.decidedAt desc (most recent first)
 * - dead column is sorted by completedAt desc (most recent first)
 */
export function buildBoard(cycles: Cycle[]): CycleBoard {
  const by = <K extends keyof Cycle>(
    list: Cycle[],
    key: K,
    dir: 'asc' | 'desc'
  ): Cycle[] =>
    [...list].sort((a, b) => {
      const av = (a[key] ?? '') as string;
      const bv = (b[key] ?? '') as string;
      return dir === 'asc'
        ? av.localeCompare(bv)
        : bv.localeCompare(av);
    });

  const hypothesisCycles = cycles
    .filter((c) => c.status === 'hypothesis')
    .sort((a, b) => b.iceScore.total - a.iceScore.total);

  const testingCycles = by(
    cycles.filter((c) => c.status === 'testing'),
    'startedAt',
    'asc'
  );

  const resultCycles = by(
    cycles.filter((c) => c.status === 'result'),
    'createdAt',
    'asc'
  );

  const scalingCycles = cycles
    .filter((c) => c.status === 'scaling')
    .sort((a, b) => {
      const at = a.decision?.decidedAt ?? '';
      const bt = b.decision?.decidedAt ?? '';
      return bt.localeCompare(at);
    });

  const deadCycles = by(
    cycles.filter((c) => c.status === 'dead'),
    'completedAt',
    'desc'
  );

  return {
    hypothesis: hypothesisCycles,
    testing:    testingCycles,
    result:     resultCycles,
    scaling:    scalingCycles,
    dead:       deadCycles,
  };
}

// ─── Board Summary ────────────────────────────────────────────────────────────

/**
 * Return a plain-text dashboard summary of the board.
 *
 * Format:
 * ```
 * ── CYCLE BOARD ─────────────────────────────────
 *  HYPOTHESIS  5 cycles  (top ICE: 8.33)
 *  TESTING     3 cycles
 *  RESULT      2 cycles  ← needs decision
 *  SCALING     4 cycles
 *  DEAD        7 cycles
 * ─────────────────────────────────────────────────
 *  TOTAL       21 cycles
 * ```
 */
export function getBoardSummary(board: CycleBoard): string {
  const total =
    board.hypothesis.length +
    board.testing.length +
    board.result.length +
    board.scaling.length +
    board.dead.length;

  const topICE =
    board.hypothesis.length > 0
      ? ` (top ICE: ${board.hypothesis[0].iceScore.total})`
      : '';

  const resultAlert =
    board.result.length > 0 ? '  \u2190 needs decision' : '';

  const pad = (label: string): string => label.padEnd(12);
  const line = '─'.repeat(50);

  const rows = [
    `${line}`,
    `  ${pad('HYPOTHESIS')} ${board.hypothesis.length} cycles${topICE}`,
    `  ${pad('TESTING')}    ${board.testing.length} cycles`,
    `  ${pad('RESULT')}     ${board.result.length} cycles${resultAlert}`,
    `  ${pad('SCALING')}    ${board.scaling.length} cycles`,
    `  ${pad('DEAD')}       ${board.dead.length} cycles`,
    `${line}`,
    `  ${pad('TOTAL')}      ${total} cycles`,
  ];

  return `── CYCLE BOARD ${'─'.repeat(35)}\n${rows.join('\n')}`;
}

// ─── Quick Cycles ─────────────────────────────────────────────────────────────

/**
 * Return hypothesis cycles with an estimatedDuration of 2 hours or less.
 *
 * These are the fastest-to-run experiments — ideal for maintaining high
 * cycle velocity when the team has short focused blocks.
 *
 * Results are sorted by ICE score desc.
 */
export function getQuickCycles(board: CycleBoard): Cycle[] {
  return board.hypothesis
    .filter((c) => durationToHours(c.estimatedDuration) <= 2)
    .sort((a, b) => b.iceScore.total - a.iceScore.total);
}

// ─── Convenience: build + query in one step ──────────────────────────────────

/**
 * Build a board from cycles and immediately return the formatted summary.
 */
export function summarizeCycles(cycles: Cycle[]): string {
  return getBoardSummary(buildBoard(cycles));
}

/**
 * Build a board from cycles and immediately return quick cycles.
 */
export function findQuickWins(cycles: Cycle[]): Cycle[] {
  return getQuickCycles(buildBoard(cycles));
}
