// One Agent Corp — Freemium → Premium Playbook
// Domain D-6: Feature gating, upgrade triggers, trial optimization

import type { Playbook, Tactic, GrowthMetric } from '../types';

// ─── Metrics ──────────────────────────────────────────────────────────────────

const metrics: GrowthMetric[] = [
  {
    id: 'freemium_conversion_rate',
    name: 'Freemium-to-Paid Conversion Rate',
    description: 'Percentage of freemium users who upgrade to any paid tier within 90 days',
    formula: 'paid_upgrades_90d / freemium_users_cohort_90d * 100',
    target: 5,
    operator: '>=',
    unit: 'percentage',
    frequency: 'monthly',
    owner: 'growth',
  },
  {
    id: 'trial_to_paid_rate',
    name: 'Trial-to-Paid Conversion Rate',
    description: 'Percentage of trial users who convert before trial expiry',
    formula: 'paid_before_expiry / total_trial_starts * 100',
    target: 20,
    operator: '>=',
    unit: 'percentage',
    frequency: 'weekly',
    owner: 'growth',
  },
  {
    id: 'feature_gate_hit_rate',
    name: 'Feature Gate Hit Rate',
    description: 'Percentage of active free users hitting a premium feature gate in a 30-day window',
    formula: 'users_who_hit_gate / monthly_active_free_users * 100',
    target: 30,
    operator: '>=',
    unit: 'percentage',
    frequency: 'monthly',
    owner: 'data',
  },
  {
    id: 'upgrade_cta_click_rate',
    name: 'Upgrade CTA Click Rate',
    description: 'Percentage of users shown an upgrade prompt who click through to pricing page',
    formula: 'upgrade_cta_clicks / upgrade_cta_impressions * 100',
    target: 12,
    operator: '>=',
    unit: 'percentage',
    frequency: 'weekly',
    owner: 'product',
  },
  {
    id: 'average_revenue_per_user',
    name: 'Average Revenue Per User (ARPU)',
    description: 'Total MRR divided by total paying customers',
    formula: 'total_mrr / total_paying_customers',
    target: 49,
    operator: '>=',
    unit: 'currency_usd',
    frequency: 'monthly',
    owner: 'sales',
  },
];

// ─── Tactics ──────────────────────────────────────────────────────────────────

const tactics: Tactic[] = [
  {
    id: 'strategic_feature_gating',
    name: 'Strategic Feature Gating Architecture',
    description: 'Identify the 20% of features that drive 80% of paid conversion. Gate those behind premium. Free tier must deliver real value but leave users wanting more.',
    owner_department: 'product',
    supporting_departments: ['data', 'engineering'],
    effort: 'medium',
    timeline_days: 14,
    success_metric: 'feature_gate_hit_rate',
    expected_roi: 'Proper gating increases gate-hit rate to 30%+; each gate hit has 8-15% conversion to upgrade prompt click',
    prerequisites: [],
    execute: (config) => ({
      department: 'product',
      payload: {
        action: 'design_feature_gating_architecture',
        objective: `Gate premium features for ${config.project.name} so >= 30% of free users hit a gate monthly`,
        deadline: (() => {
          const d = new Date(); d.setDate(d.getDate() + 14); return d.toISOString();
        })(),
        resources: ['feature_flags_system', 'product_analytics', 'pricing_research'],
        kpi_targets: { feature_gate_hit_rate: 30 },
        context: {
          gating_principles: [
            'free_delivers_standalone_value',
            'premium_features_are_collaborative_or_scale',
            'no_time_bombs_only_usage_limits',
            'gate_at_natural_upgrade_moment',
          ],
          free_tier_limits: { projects: 3, team_members: 1, exports: 10, storage_gb: 1 },
          premium_features: ['unlimited_projects', 'team_collaboration', 'advanced_analytics', 'api_access', 'priority_support'],
          project: config.project.name,
        },
      },
    }),
  },
  {
    id: 'trial_optimization',
    name: 'Trial Optimization Engine',
    description: 'Design optimal trial: duration, what features unlock, drip email sequence, in-trial nudges at key moments',
    owner_department: 'growth',
    supporting_departments: ['product', 'engineering'],
    effort: 'medium',
    timeline_days: 10,
    success_metric: 'trial_to_paid_rate',
    expected_roi: 'Optimized trial sequences increase trial-to-paid by 20-40%; drip emails add 5-10% uplift',
    prerequisites: ['strategic_feature_gating'],
    execute: (config) => ({
      department: 'growth',
      payload: {
        action: 'implement_trial_optimization',
        objective: `Optimize trial experience for ${config.project.name} to achieve >= 20% trial-to-paid conversion`,
        deadline: (() => {
          const d = new Date(); d.setDate(d.getDate() + 10); return d.toISOString();
        })(),
        resources: ['email_automation', 'in_app_messaging', 'analytics'],
        kpi_targets: { trial_to_paid_rate: 20 },
        context: {
          trial_duration_days: 14,
          full_feature_access: true,
          drip_sequence: [
            { day: 0, trigger: 'welcome_and_quickstart' },
            { day: 3, trigger: 'aha_moment_check_and_tips' },
            { day: 7, trigger: 'social_proof_and_case_study' },
            { day: 11, trigger: 'trial_expiry_warning_with_roi_data' },
            { day: 13, trigger: 'last_chance_with_discount_offer' },
          ],
          in_trial_nudges: ['usage_milestone_celebration', 'approaching_expiry_banner', 'teammate_invite_prompt'],
          project: config.project.name,
        },
      },
    }),
  },
  {
    id: 'contextual_upgrade_prompts',
    name: 'Contextual In-App Upgrade Prompts',
    description: 'Show upgrade CTAs at the exact moment users hit a limit or try to use a gated feature — not as popups, but as natural next steps',
    owner_department: 'product',
    supporting_departments: ['engineering', 'data'],
    effort: 'low',
    timeline_days: 7,
    success_metric: 'upgrade_cta_click_rate',
    expected_roi: 'Contextual upgrade prompts convert at 3-5x vs generic banner ads; adds 15-25% to monthly paid conversions',
    prerequisites: ['strategic_feature_gating'],
    execute: (config) => ({
      department: 'product',
      payload: {
        action: 'implement_contextual_upgrade_prompts',
        objective: `Drive >= 12% upgrade CTA click rate for ${config.project.name} with contextual prompts`,
        deadline: (() => {
          const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString();
        })(),
        resources: ['in_app_notification_system', 'feature_flags', 'a_b_testing'],
        kpi_targets: { upgrade_cta_click_rate: 12, freemium_conversion_rate: 5 },
        context: {
          prompt_types: [
            { trigger: 'gate_hit', message: 'Upgrade to unlock {feature_name} — {benefit}', cta: 'Upgrade Now' },
            { trigger: 'usage_limit_80pct', message: 'You are near your limit — upgrade for unlimited', cta: 'See Plans' },
            { trigger: 'team_invite_blocked', message: 'Invite unlimited teammates on Pro', cta: 'Start Team Plan' },
          ],
          prompt_rules: 'max 1 per session, never interrupt core workflow, always show value before price',
          project: config.project.name,
        },
      },
    }),
  },
  {
    id: 'pricing_page_optimization',
    name: 'Pricing Page A/B Testing & Optimization',
    description: 'Continuously test pricing page: anchor pricing, value metric messaging, plan names, CTA copy, social proof placement',
    owner_department: 'growth',
    supporting_departments: ['data', 'product'],
    effort: 'low',
    timeline_days: 30,
    success_metric: 'average_revenue_per_user',
    expected_roi: 'Pricing page optimization can increase ARPU by 10-30% with right anchoring and value communication',
    prerequisites: [],
    execute: (config) => ({
      department: 'growth',
      payload: {
        action: 'optimize_pricing_page',
        objective: `Increase ARPU to >= $49 for ${config.project.name} through systematic pricing page optimization`,
        deadline: (() => {
          const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString();
        })(),
        resources: ['a_b_testing_tool', 'hotjar_or_equivalent', 'copywriter'],
        kpi_targets: { average_revenue_per_user: 49, freemium_conversion_rate: 5 },
        context: {
          test_variables: ['plan_count_2_vs_3', 'annual_vs_monthly_default', 'pricing_table_layout', 'cta_copy', 'social_proof_position'],
          recommended_structure: {
            plans: ['Free', 'Pro ($29/mo)', 'Team ($79/mo/seat)', 'Enterprise (custom)'],
            anchor_strategy: 'highlight_pro_as_most_popular',
            value_metric: 'per_seat_or_per_project_based_on_usage_data',
          },
          project: config.project.name,
        },
      },
    }),
  },
];

// ─── Playbook Export ──────────────────────────────────────────────────────────

export const freemiumPlaybook: Playbook = {
  id: 'freemium',
  name: 'Freemium → Premium Conversion',
  description: 'Grow by giving away substantial free value, then converting high-intent users through strategic feature gating, optimized trials, and contextual upgrade prompts. Target: 5% freemium-to-paid, 20% trial-to-paid.',
  stage_applicable: ['launch', 'growth', 'scale'],
  target_markets: ['B2B SaaS', 'B2C SaaS', 'Developer Tools', 'Prosumer'],
  departments_involved: ['product', 'growth', 'engineering', 'data', 'sales'],
  tactics,
  metrics,
  min_team_size: 3,
  min_monthly_budget_usd: 1500,
  priority: 3,
};
