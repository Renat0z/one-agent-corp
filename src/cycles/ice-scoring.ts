// One Agent Corp — ICE Score Calculator
// Domain D-7: Prioritization engine for experimentation cycles
// ICE = (Impact + Confidence + Ease) / 3 — use it to pick what to test NEXT

import type { ICEScore, Cycle } from './types';

// ─── Validation ───────────────────────────────────────────────────────────────

function clamp(value: number, min = 1, max = 10): number {
  if (!Number.isFinite(value)) {
    throw new Error(`ICE score components must be finite numbers, got: ${value}`);
  }
  if (value < min || value > max) {
    throw new Error(
      `ICE score components must be between ${min} and ${max}, got: ${value}`
    );
  }
  return value;
}

// ─── Core Calculator ──────────────────────────────────────────────────────────

/**
 * Calculate an ICEScore from raw components.
 *
 * All inputs must be integers or decimals in the range [1, 10].
 * The `total` is rounded to two decimal places.
 *
 * @example
 * calculateICE(8, 6, 9) → { impact: 8, confidence: 6, ease: 9, total: 7.67 }
 */
export function calculateICE(
  impact: number,
  confidence: number,
  ease: number
): ICEScore {
  const i = clamp(impact);
  const c = clamp(confidence);
  const e = clamp(ease);
  const total = Math.round(((i + c + e) / 3) * 100) / 100;

  return { impact: i, confidence: c, ease: e, total };
}

// ─── Ranking ──────────────────────────────────────────────────────────────────

/**
 * Return cycles sorted by ICE total descending (highest priority first).
 * Does NOT mutate the input array.
 *
 * @example
 * rankByICE(cycles) → [cycle_ice_9, cycle_ice_7, cycle_ice_4, ...]
 */
export function rankByICE(cycles: Cycle[]): Cycle[] {
  return [...cycles].sort(
    (a, b) => b.iceScore.total - a.iceScore.total
  );
}

// ─── Suggestion Engine ────────────────────────────────────────────────────────

/**
 * Return the top N hypothesis cycles ranked by ICE score.
 *
 * Only cycles with status === 'hypothesis' are considered — cycles already
 * in testing or beyond are excluded because they are already running.
 *
 * @param cycles     Full cycle list (any mix of statuses)
 * @param maxResults Maximum number of suggestions to return (default: 5)
 *
 * @example
 * suggestNextExperiments(allCycles, 3)
 * → top 3 hypothesis cycles sorted by ICE
 */
export function suggestNextExperiments(
  cycles: Cycle[],
  maxResults: number = 5
): Cycle[] {
  if (maxResults < 1) {
    throw new Error(`maxResults must be >= 1, got: ${maxResults}`);
  }

  const hypotheses = cycles.filter((c) => c.status === 'hypothesis');
  const ranked = rankByICE(hypotheses);
  return ranked.slice(0, maxResults);
}

// ─── Score Explanation ────────────────────────────────────────────────────────

/**
 * Return a human-readable explanation of an ICE score.
 * Useful for dashboard tooltips and CEO reports.
 *
 * @example
 * explainICE({ impact: 9, confidence: 4, ease: 7, total: 6.67 })
 * → "ICE 6.67 — High impact (9/10), low confidence (4/10), easy to test (7/10)"
 */
export function explainICE(score: ICEScore): string {
  const label = (v: number): string => {
    if (v >= 8) return 'high';
    if (v >= 5) return 'medium';
    return 'low';
  };

  return (
    `ICE ${score.total} — ` +
    `${label(score.impact)} impact (${score.impact}/10), ` +
    `${label(score.confidence)} confidence (${score.confidence}/10), ` +
    `${label(score.ease)} ease (${score.ease}/10)`
  );
}
