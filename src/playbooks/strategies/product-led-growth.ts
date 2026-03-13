// One Agent Corp — Product-Led Growth (PLG) Playbook
// Domain D-6: Self-serve onboarding, in-product virality, usage-based expansion

import type { Playbook, Tactic, GrowthMetric } from '../types';

// ─── Metrics ──────────────────────────────────────────────────────────────────

const metrics: GrowthMetric[] = [
  {
    id: 'time_to_value',
    name: 'Time to Value (TTV)',
    description: 'Minutes from signup to user experiencing the core value of the product (aha moment)',
    formula: 'median(aha_moment_at - signup_at) in minutes',
    target: 5,
    operator: '<=',
    unit: 'days',
    frequency: 'weekly',
    owner: 'product',
  },
  {
    id: 'product_qualified_leads',
    name: 'Product Qualified Leads (PQL)',
    description: 'Free users who have hit usage thresholds indicating readiness to pay',
    formula: 'users_who_triggered_pql_events in last 30 days',
    target: 50,
    operator: '>=',
    unit: 'count',
    frequency: 'weekly',
    owner: 'data',
  },
  {
    id: 'free_to_paid_conversion',
    name: 'Free-to-Paid Conversion Rate',
    description: 'Percentage of free/trial users who upgrade to a paid plan within 30 days',
    formula: 'paid_conversions_30d / free_signups_30d * 100',
    target: 8,
    operator: '>=',
    unit: 'percentage',
    frequency: 'monthly',
    owner: 'growth',
  },
  {
    id: 'activation_rate',
    name: 'Activation Rate',
    description: 'Percentage of signups who complete the onboarding checklist and reach core action',
    formula: 'users_completed_onboarding / total_signups * 100',
    target: 60,
    operator: '>=',
    unit: 'percentage',
    frequency: 'weekly',
    owner: 'product',
  },
  {
    id: 'expansion_mrr_rate',
    name: 'Expansion MRR Rate',
    description: 'Monthly revenue growth from existing customers upgrading or adding seats',
    formula: 'expansion_mrr_current / total_mrr_previous * 100',
    target: 15,
    operator: '>=',
    unit: 'percentage',
    frequency: 'monthly',
    owner: 'sales',
  },
];

// ─── Tactics ──────────────────────────────────────────────────────────────────

const tactics: Tactic[] = [
  {
    id: 'frictionless_signup',
    name: 'Frictionless Self-Serve Signup',
    description: 'Eliminate barriers: SSO via Google/GitHub, no credit card required, single-field email signup, instant access',
    owner_department: 'engineering',
    supporting_departments: ['product', 'growth'],
    effort: 'medium',
    timeline_days: 10,
    success_metric: 'activation_rate',
    expected_roi: 'Removing CC requirement typically increases trial signups by 40-60%; SSO reduces drop-off by 25%',
    prerequisites: [],
    execute: (config) => ({
      department: 'engineering',
      payload: {
        action: 'implement_frictionless_signup',
        objective: `Reduce signup friction for ${config.project.name} to achieve >= 60% activation rate`,
        deadline: (() => {
          const d = new Date(); d.setDate(d.getDate() + 10); return d.toISOString();
        })(),
        resources: ['auth0_or_clerk', 'oauth_providers', 'frontend_sprint'],
        kpi_targets: { activation_rate: 60 },
        context: {
          auth_methods: ['google_sso', 'github_sso', 'magic_link', 'email_password'],
          no_credit_card: true,
          instant_access: true,
          fields_at_signup: ['email_only'],
          project: config.project.name,
        },
      },
    }),
  },
  {
    id: 'interactive_onboarding',
    name: 'Interactive Onboarding with Aha Moment Focus',
    description: 'Build guided onboarding that gets users to their first success within 5 minutes: tooltips, checklists, sample data, in-app tutorials',
    owner_department: 'product',
    supporting_departments: ['engineering', 'data'],
    effort: 'high',
    timeline_days: 21,
    success_metric: 'time_to_value',
    expected_roi: 'Every 1-minute reduction in TTV increases 7-day retention by 3-5%; activated users convert at 3x rate',
    prerequisites: ['frictionless_signup'],
    execute: (config) => ({
      department: 'product',
      payload: {
        action: 'build_interactive_onboarding',
        objective: `Reduce time-to-value to <= 5 minutes for ${config.project.name} through guided onboarding`,
        deadline: (() => {
          const d = new Date(); d.setDate(d.getDate() + 21); return d.toISOString();
        })(),
        resources: ['intercom_or_appcues', 'product_analytics', 'ux_designer'],
        kpi_targets: { time_to_value: 5, activation_rate: 60 },
        context: {
          aha_moment: 'user completes first meaningful action and sees tangible output',
          onboarding_steps: ['define_aha_moment', 'remove_steps_before_it', 'add_tooltips', 'create_sample_data', 'checklist_with_progress_bar'],
          personalization: 'ask use-case at signup, customize onboarding path',
          project: config.project.name,
        },
      },
    }),
  },
  {
    id: 'pql_scoring_and_triggers',
    name: 'Product Qualified Lead (PQL) Scoring',
    description: 'Define usage signals that predict purchase intent; auto-alert sales when free users hit PQL threshold',
    owner_department: 'data',
    supporting_departments: ['sales', 'engineering'],
    effort: 'medium',
    timeline_days: 14,
    success_metric: 'product_qualified_leads',
    expected_roi: 'PQL-triggered outreach converts at 3-5x higher rate than time-based outreach; reduces sales cycle by 40%',
    prerequisites: ['frictionless_signup'],
    execute: (config) => ({
      department: 'data',
      payload: {
        action: 'implement_pql_scoring',
        objective: `Identify and surface >= 50 PQLs/month for ${config.project.name} to sales team`,
        deadline: (() => {
          const d = new Date(); d.setDate(d.getDate() + 14); return d.toISOString();
        })(),
        resources: ['segment_or_mixpanel', 'crm_integration', 'data_engineer'],
        kpi_targets: { product_qualified_leads: 50, free_to_paid_conversion: 8 },
        context: {
          pql_signals: [
            'used_core_feature_5_times_in_7_days',
            'invited_team_member',
            'exported_or_shared_output',
            'hit_free_tier_limit',
            'returned_3_consecutive_days',
          ],
          pql_score_threshold: 70,
          crm_action: 'create_opportunity_and_notify_ae',
          in_app_action: 'show_upgrade_prompt_with_roi_calculator',
          project: config.project.name,
        },
      },
    }),
  },
  {
    id: 'usage_based_expansion',
    name: 'Usage-Based Expansion Triggers',
    description: 'Design pricing and in-product prompts that drive natural expansion: seat-based, usage-based, feature-gated upgrades',
    owner_department: 'product',
    supporting_departments: ['sales', 'growth'],
    effort: 'medium',
    timeline_days: 21,
    success_metric: 'expansion_mrr_rate',
    expected_roi: 'Expansion MRR of 15%+ keeps net revenue retention > 100%; reduces need for new customer acquisition',
    prerequisites: ['pql_scoring_and_triggers'],
    execute: (config) => ({
      department: 'product',
      payload: {
        action: 'implement_expansion_triggers',
        objective: `Drive expansion MRR to >= 15% monthly for ${config.project.name} via in-product upsell moments`,
        deadline: (() => {
          const d = new Date(); d.setDate(d.getDate() + 21); return d.toISOString();
        })(),
        resources: ['billing_system', 'feature_flags', 'in_app_messaging'],
        kpi_targets: { expansion_mrr_rate: 15, free_to_paid_conversion: 8 },
        context: {
          expansion_triggers: [
            'approaching_usage_limit_80pct',
            'team_size_exceeds_free_tier',
            'accessing_premium_feature',
            'monthly_usage_spike',
          ],
          pricing_model: 'usage-based with seat multiplier',
          upgrade_flow: 'frictionless in-app checkout with immediate plan activation',
          project: config.project.name,
        },
      },
    }),
  },
];

// ─── Playbook Export ──────────────────────────────────────────────────────────

export const productLedGrowthPlaybook: Playbook = {
  id: 'product-led-growth',
  name: 'Product-Led Growth (PLG)',
  description: 'Let the product drive acquisition, activation, and expansion. Self-serve onboarding eliminates sales for SMB segment; PQL scoring surfaces hand-raise signals; usage-based expansion drives NRR > 100%.',
  stage_applicable: ['mvp', 'launch', 'growth', 'scale'],
  target_markets: ['B2B SaaS', 'Developer Tools', 'Prosumer', 'B2C SaaS'],
  departments_involved: ['product', 'engineering', 'data', 'growth', 'sales'],
  tactics,
  metrics,
  min_team_size: 4,
  min_monthly_budget_usd: 3000,
  priority: 2,
};
