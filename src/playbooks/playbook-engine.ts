// One Agent Corp — Playbook Engine
// Domain D-6: Strategy pattern for selecting and executing growth playbooks

import type {
  Playbook,
  PlaybookId,
  PlaybookConfig,
  PlaybookResult,
  PlaybookSelectionCriteria,
  MetricEvaluation,
  TacticExecution,
  IPlaybookEngine,
} from './types';

import { viralLoopsPlaybook } from './strategies/viral-loops';
import { productLedGrowthPlaybook } from './strategies/product-led-growth';
import { freemiumPlaybook } from './strategies/freemium';
import { contentLedPlaybook } from './strategies/content-led';
import { communityLedPlaybook } from './strategies/community-led';

// ─── Engine Implementation ────────────────────────────────────────────────────

export class PlaybookEngine implements IPlaybookEngine {
  private readonly registry: Map<PlaybookId, Playbook> = new Map();

  constructor(playbooks?: Playbook[]) {
    // Register defaults
    const defaults: Playbook[] = [
      viralLoopsPlaybook,
      productLedGrowthPlaybook,
      freemiumPlaybook,
      contentLedPlaybook,
      communityLedPlaybook,
    ];
    for (const pb of defaults) {
      this.registry.set(pb.id, pb);
    }
    // Register any additional playbooks provided at construction time
    if (playbooks) {
      for (const pb of playbooks) {
        this.registry.set(pb.id, pb);
      }
    }
  }

  // ── Registry Operations ────────────────────────────────────────────────────

  register(playbook: Playbook): void {
    this.registry.set(playbook.id, playbook);
  }

  getPlaybook(id: PlaybookId): Playbook | undefined {
    return this.registry.get(id);
  }

  listPlaybooks(): Playbook[] {
    return Array.from(this.registry.values()).sort((a, b) => a.priority - b.priority);
  }

  // ── Selection Strategy ────────────────────────────────────────────────────

  /**
   * Selects applicable playbooks based on:
   * 1. Stage match — playbook must support the project's current stage
   * 2. Market match — playbook must target the project's market
   * 3. Budget eligibility — project budget >= playbook minimum
   * 4. Team eligibility — project team_size >= playbook minimum
   * 5. Exclusion list — skip already-running playbooks
   *
   * Returns sorted by playbook.priority (ascending = most important first)
   */
  selectPlaybooks(criteria: PlaybookSelectionCriteria): Playbook[] {
    const { stage, target_market, monthly_budget_usd, team_size, exclude = [] } = criteria;

    const selected = Array.from(this.registry.values()).filter((pb) => {
      // Must not be excluded
      if (exclude.includes(pb.id)) return false;

      // Stage must match
      if (!pb.stage_applicable.includes(stage)) return false;

      // Market must match
      if (!pb.target_markets.includes(target_market)) return false;

      // Budget must meet minimum
      if (monthly_budget_usd < pb.min_monthly_budget_usd) return false;

      // Team size must meet minimum
      if (team_size < pb.min_team_size) return false;

      return true;
    });

    return selected.sort((a, b) => a.priority - b.priority);
  }

  // ── Metric Evaluation ─────────────────────────────────────────────────────

  evaluateMetrics(
    playbook: Playbook,
    currentMetrics: Record<string, number>
  ): MetricEvaluation[] {
    return playbook.metrics.map((metric) => {
      const current = currentMetrics[metric.id];
      const hasCurrent = current !== undefined;

      let passed = false;
      if (hasCurrent) {
        switch (metric.operator) {
          case '>=': passed = current >= metric.target; break;
          case '<=': passed = current <= metric.target; break;
          case '>':  passed = current > metric.target;  break;
          case '<':  passed = current < metric.target;  break;
          case '==': passed = current === metric.target; break;
          case '!=': passed = current !== metric.target; break;
        }
      }

      return {
        metric_id: metric.id,
        metric_name: metric.name,
        current_value: current,
        target: metric.target,
        operator: metric.operator,
        passed,
        delta: hasCurrent ? current - metric.target : undefined,
      };
    });
  }

  // ── Playbook Execution ────────────────────────────────────────────────────

  /**
   * Executes a playbook against a project:
   * 1. Filters tactics applicable given prerequisites satisfied
   * 2. Executes each eligible tactic → generates TacticDirective
   * 3. Evaluates all metrics against current values
   * 4. Computes overall health and recommendations
   */
  executePlaybook(playbook: Playbook, config: PlaybookConfig): PlaybookResult {
    const now = new Date().toISOString();
    const executedTactics: TacticExecution[] = [];
    const selectedTacticIds: string[] = [];

    // Track which tactics have been "completed" (for prerequisite resolution)
    const completedTactics = new Set<string>();

    // Execute tactics in order, respecting prerequisites
    const ordered = [...playbook.tactics].sort((a, b) => a.prerequisites.length - b.prerequisites.length);

    for (const tactic of ordered) {
      const prereqsMet = tactic.prerequisites.every(
        (prereqId) => completedTactics.has(prereqId)
      );

      if (!prereqsMet) {
        // Skip tactics whose prerequisites are not yet executed
        continue;
      }

      selectedTacticIds.push(tactic.id);

      const directive = tactic.execute(config);

      executedTactics.push({
        tactic_id: tactic.id,
        tactic_name: tactic.name,
        directive,
        executed_at: now,
      });

      completedTactics.add(tactic.id);
    }

    // Evaluate metrics
    const metricEvaluations = this.evaluateMetrics(
      playbook,
      config.project.current_metrics
    );

    // Compute overall health
    const totalMetrics = metricEvaluations.length;
    const passedMetrics = metricEvaluations.filter((m) => m.passed).length;
    const failRate = totalMetrics > 0 ? (totalMetrics - passedMetrics) / totalMetrics : 0;

    const overall_health: 'green' | 'yellow' | 'red' =
      failRate === 0
        ? 'green'
        : failRate <= 0.5
        ? 'yellow'
        : 'red';

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      playbook,
      metricEvaluations,
      overall_health
    );

    return {
      playbook_id: playbook.id,
      playbook_name: playbook.name,
      project_id: config.project.id,
      selected_tactics: selectedTacticIds,
      executed_tactics: executedTactics,
      metric_evaluations: metricEvaluations,
      overall_health,
      recommendations,
      generated_at: now,
    };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private generateRecommendations(
    playbook: Playbook,
    evaluations: MetricEvaluation[],
    health: 'green' | 'yellow' | 'red'
  ): string[] {
    const recs: string[] = [];

    if (health === 'green') {
      recs.push(`All ${playbook.name} metrics on track. Consider scaling budget allocation to accelerate growth.`);
      return recs;
    }

    // Add specific recs for failing metrics
    for (const ev of evaluations) {
      if (!ev.passed) {
        const metric = playbook.metrics.find((m) => m.id === ev.metric_id);
        if (!metric) continue;

        const currentStr = ev.current_value !== undefined
          ? `current: ${ev.current_value}${metric.unit === 'percentage' ? '%' : ''}`
          : 'no data yet';

        recs.push(
          `[${metric.name}] Below target (${currentStr}, target: ${metric.operator} ${metric.target}${metric.unit === 'percentage' ? '%' : ''}). ` +
          `Owner: ${metric.owner}. Increase frequency to ${metric.frequency} tracking.`
        );
      }
    }

    if (health === 'red') {
      recs.push(
        `CRITICAL: ${playbook.name} playbook is underperforming. Recommend pausing lowest-priority tactics and doubling down on highest-ROI activities.`
      );
    }

    return recs;
  }
}

// ─── Singleton Export ──────────────────────────────────────────────────────────

/** Default engine instance pre-loaded with all 5 playbooks */
export const playbookEngine = new PlaybookEngine();

// ─── Convenience Functions ────────────────────────────────────────────────────

/**
 * Quick-select playbooks for a given project state.
 * Uses the default engine singleton.
 */
export function selectPlaybooksForProject(config: PlaybookConfig): Playbook[] {
  return playbookEngine.selectPlaybooks({
    stage: config.project.stage,
    target_market: config.project.target_market,
    monthly_budget_usd: config.project.monthly_budget_usd,
    team_size: config.project.team_size,
    exclude: config.project.active_playbooks,
  });
}

/**
 * Execute all selected playbooks for a project and return results.
 * Uses the default engine singleton.
 */
export function runAllPlaybooks(config: PlaybookConfig): PlaybookResult[] {
  const selected = selectPlaybooksForProject(config);
  return selected.map((pb) => playbookEngine.executePlaybook(pb, config));
}
