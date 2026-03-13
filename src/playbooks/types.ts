// One Agent Corp — Growth Hacking Playbook Types
// Domain D-6: Templates for growth strategies as executable code

import type { DepartmentId } from '../types/organization';
import type { DirectivePayload } from '../messaging/types';

// ─── Pipeline Stage (independent from D-5 to avoid circular dependency) ───────

export type PlaybookStage =
  | 'ideation'
  | 'validation'
  | 'mvp'
  | 'launch'
  | 'growth'
  | 'scale';

export type TargetMarket =
  | 'B2B SaaS'
  | 'B2C SaaS'
  | 'Marketplace'
  | 'Developer Tools'
  | 'Prosumer'
  | 'Enterprise';

export type PlaybookId =
  | 'viral-loops'
  | 'product-led-growth'
  | 'freemium'
  | 'content-led'
  | 'community-led';

// ─── Growth Metric ────────────────────────────────────────────────────────────

export type MetricOperator = '>=' | '<=' | '>' | '<' | '==' | '!=';

export interface GrowthMetric {
  id: string;
  name: string;
  description: string;
  formula: string;                    // e.g. "new_users_from_referrals / total_new_users"
  target: number;
  operator: MetricOperator;           // pass condition: metric.value operator target
  unit: 'percentage' | 'ratio' | 'count' | 'currency_usd' | 'days' | 'score';
  frequency: 'daily' | 'weekly' | 'monthly';
  owner: DepartmentId;
}

// ─── Tactic ───────────────────────────────────────────────────────────────────

export type TacticStatus = 'pending' | 'active' | 'completed' | 'paused' | 'failed';

export interface TacticDirective {
  department: DepartmentId;
  payload: DirectivePayload;
}

export interface Tactic {
  id: string;
  name: string;
  description: string;
  owner_department: DepartmentId;
  supporting_departments: DepartmentId[];
  effort: 'low' | 'medium' | 'high';    // execution effort required
  timeline_days: number;                 // expected days to see results
  success_metric: string;                // GrowthMetric.id this tactic drives
  expected_roi: string;                  // qualitative ROI description
  prerequisites: string[];               // tactic ids or conditions
  execute: (config: PlaybookConfig) => TacticDirective;
}

// ─── Playbook ─────────────────────────────────────────────────────────────────

export interface Playbook {
  id: PlaybookId;
  name: string;
  description: string;
  stage_applicable: PlaybookStage[];
  target_markets: TargetMarket[];
  departments_involved: DepartmentId[];
  tactics: Tactic[];
  metrics: GrowthMetric[];
  min_team_size: number;
  min_monthly_budget_usd: number;
  priority: number;                      // 1 = highest; used by engine for ordering
}

// ─── PlaybookConfig ───────────────────────────────────────────────────────────

export interface ProjectState {
  id: string;
  name: string;
  stage: PlaybookStage;
  target_market: TargetMarket;
  monthly_budget_usd: number;
  team_size: number;
  current_metrics: Record<string, number>;  // GrowthMetric.id → current value
  active_playbooks: PlaybookId[];
  started_at: string;                        // ISO-8601
}

export interface PlaybookConfig {
  project: ProjectState;
  custom_params?: Record<string, unknown>;
}

// ─── PlaybookResult ───────────────────────────────────────────────────────────

export interface MetricEvaluation {
  metric_id: string;
  metric_name: string;
  current_value: number | undefined;
  target: number;
  operator: MetricOperator;
  passed: boolean;
  delta: number | undefined;             // current_value - target (undefined if no current)
}

export interface TacticExecution {
  tactic_id: string;
  tactic_name: string;
  directive: TacticDirective;
  executed_at: string;
}

export interface PlaybookResult {
  playbook_id: PlaybookId;
  playbook_name: string;
  project_id: string;
  selected_tactics: string[];            // tactic ids
  executed_tactics: TacticExecution[];
  metric_evaluations: MetricEvaluation[];
  overall_health: 'green' | 'yellow' | 'red';  // green: all pass, yellow: some fail, red: majority fail
  recommendations: string[];
  generated_at: string;
}

// ─── Engine Contracts ─────────────────────────────────────────────────────────

export interface PlaybookSelectionCriteria {
  stage: PlaybookStage;
  target_market: TargetMarket;
  monthly_budget_usd: number;
  team_size: number;
  exclude?: PlaybookId[];               // already running or explicitly excluded
}

export interface IPlaybookEngine {
  register(playbook: Playbook): void;
  selectPlaybooks(criteria: PlaybookSelectionCriteria): Playbook[];
  executePlaybook(playbook: Playbook, config: PlaybookConfig): PlaybookResult;
  evaluateMetrics(playbook: Playbook, currentMetrics: Record<string, number>): MetricEvaluation[];
  getPlaybook(id: PlaybookId): Playbook | undefined;
  listPlaybooks(): Playbook[];
}
