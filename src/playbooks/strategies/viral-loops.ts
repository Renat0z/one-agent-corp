// One Agent Corp — Viral Loops Playbook
// Domain D-6: Referral programs, network effects, sharing mechanics

import type { Playbook, Tactic, GrowthMetric } from '../types';

// ─── Metrics ──────────────────────────────────────────────────────────────────

const metrics: GrowthMetric[] = [
  {
    id: 'viral_k_factor',
    name: 'K-Factor (Viral Coefficient)',
    description: 'Average number of new users each existing user brings in',
    formula: 'invitations_sent_per_user * invitation_conversion_rate',
    target: 1.5,
    operator: '>=',
    unit: 'ratio',
    frequency: 'weekly',
    owner: 'growth',
  },
  {
    id: 'referral_conversion_rate',
    name: 'Referral Conversion Rate',
    description: 'Percentage of referred users who convert to active accounts',
    formula: 'referred_users_activated / total_referral_invites_sent * 100',
    target: 25,
    operator: '>=',
    unit: 'percentage',
    frequency: 'weekly',
    owner: 'growth',
  },
  {
    id: 'dau_mau_ratio',
    name: 'DAU/MAU Ratio',
    description: 'Daily Active Users divided by Monthly Active Users — stickiness proxy',
    formula: 'daily_active_users / monthly_active_users * 100',
    target: 40,
    operator: '>=',
    unit: 'percentage',
    frequency: 'daily',
    owner: 'data',
  },
  {
    id: 'viral_cycle_time',
    name: 'Viral Cycle Time',
    description: 'Average days from user signup to first referral sent',
    formula: 'median(referral_sent_at - signup_at) in days',
    target: 7,
    operator: '<=',
    unit: 'days',
    frequency: 'weekly',
    owner: 'data',
  },
  {
    id: 'nps_score',
    name: 'Net Promoter Score',
    description: 'Willingness of users to recommend the product (promoters - detractors)',
    formula: '%_promoters - %_detractors',
    target: 50,
    operator: '>=',
    unit: 'score',
    frequency: 'monthly',
    owner: 'growth',
  },
];

// ─── Tactics ──────────────────────────────────────────────────────────────────

const tactics: Tactic[] = [
  {
    id: 'referral_program_setup',
    name: 'Referral Program Setup',
    description: 'Design and launch a two-sided referral program: referrer earns credits, referred user gets extended trial or discount',
    owner_department: 'growth',
    supporting_departments: ['engineering', 'product'],
    effort: 'medium',
    timeline_days: 14,
    success_metric: 'viral_k_factor',
    expected_roi: 'CAC reduction of 30-50% for referred users; typically 3-5x higher LTV vs paid acquisition',
    prerequisites: [],
    execute: (config) => ({
      department: 'growth',
      payload: {
        action: 'launch_referral_program',
        objective: `Achieve K-factor >= 1.5 for ${config.project.name} within 60 days of launch`,
        deadline: (() => {
          const d = new Date(); d.setDate(d.getDate() + 14); return d.toISOString();
        })(),
        resources: ['referral_platform', 'email_automation', 'credit_system'],
        kpi_targets: { viral_k_factor: 1.5, referral_conversion_rate: 25 },
        context: {
          program_type: 'two-sided',
          referrer_reward: '1 month free credit',
          referee_reward: '30-day extended trial',
          channels: ['in-app', 'email', 'unique_link'],
          project: config.project.name,
        },
      },
    }),
  },
  {
    id: 'share_on_milestone',
    name: 'Share-on-Milestone Triggers',
    description: 'Auto-prompt users to share when they hit a meaningful product milestone (first success, 10th task, etc.)',
    owner_department: 'product',
    supporting_departments: ['engineering', 'growth'],
    effort: 'low',
    timeline_days: 7,
    success_metric: 'viral_cycle_time',
    expected_roi: 'Organic social shares reduce paid acquisition by 15-20%; boosts brand awareness',
    prerequisites: ['referral_program_setup'],
    execute: (config) => ({
      department: 'product',
      payload: {
        action: 'implement_milestone_sharing',
        objective: `Trigger share prompts at key moments to reduce viral cycle time below 7 days for ${config.project.name}`,
        deadline: (() => {
          const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString();
        })(),
        resources: ['in-app_notifications', 'social_share_api'],
        kpi_targets: { viral_cycle_time: 7 },
        context: {
          trigger_events: ['first_export', 'project_complete', 'team_invite_accepted', 'streak_7_days'],
          share_platforms: ['twitter', 'linkedin', 'slack'],
          pre_populated_message: true,
          project: config.project.name,
        },
      },
    }),
  },
  {
    id: 'network_effect_features',
    name: 'Network Effect Feature Design',
    description: 'Build features that become more valuable with more users: collaborative workspaces, public profiles, leaderboards',
    owner_department: 'product',
    supporting_departments: ['engineering', 'data'],
    effort: 'high',
    timeline_days: 30,
    success_metric: 'dau_mau_ratio',
    expected_roi: 'Network effects compound: each new user increases retention of existing users by 5-8%',
    prerequisites: [],
    execute: (config) => ({
      department: 'product',
      payload: {
        action: 'design_network_effect_features',
        objective: `Increase DAU/MAU ratio to >= 40% by making ${config.project.name} inherently collaborative`,
        deadline: (() => {
          const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString();
        })(),
        resources: ['product_team', 'engineering_sprint', 'user_research'],
        kpi_targets: { dau_mau_ratio: 40 },
        context: {
          feature_candidates: ['team_workspaces', 'public_portfolio', 'activity_feed', 'peer_reviews'],
          success_model: 'Slack (channel discovery), Notion (public templates), Figma (multiplayer)',
          project: config.project.name,
        },
      },
    }),
  },
  {
    id: 'nps_driven_advocacy',
    name: 'NPS-Driven Advocacy Program',
    description: 'Identify promoters (NPS 9-10) and activate them as brand advocates via case studies, social proof, referrals',
    owner_department: 'growth',
    supporting_departments: ['sales', 'data'],
    effort: 'low',
    timeline_days: 21,
    success_metric: 'nps_score',
    expected_roi: 'Promoters refer 2.5x more users than average; case studies reduce B2B sales cycle by 20-30%',
    prerequisites: [],
    execute: (config) => ({
      department: 'growth',
      payload: {
        action: 'activate_nps_advocates',
        objective: `Convert NPS promoters into active referral sources, targeting NPS >= 50 for ${config.project.name}`,
        deadline: (() => {
          const d = new Date(); d.setDate(d.getDate() + 21); return d.toISOString();
        })(),
        resources: ['nps_survey_tool', 'crm_integration', 'advocate_rewards_budget'],
        kpi_targets: { nps_score: 50, referral_conversion_rate: 25 },
        context: {
          survey_timing: 'day_14_and_day_60',
          promoter_actions: ['case_study_feature', 'referral_bonus_upgrade', 'beta_access', 'testimonial_request'],
          detractor_actions: ['immediate_support_outreach', 'feature_request_priority'],
          project: config.project.name,
        },
      },
    }),
  },
];

// ─── Playbook Export ──────────────────────────────────────────────────────────

export const viralLoopsPlaybook: Playbook = {
  id: 'viral-loops',
  name: 'Viral Loops',
  description: 'Drive organic growth by engineering product virality: referral programs, share triggers, network effects, and NPS-based advocacy. Goal: K-factor >= 1.5 so each user brings in more than one new user.',
  stage_applicable: ['launch', 'growth', 'scale'],
  target_markets: ['B2C SaaS', 'Prosumer', 'Developer Tools', 'Marketplace'],
  departments_involved: ['growth', 'product', 'engineering', 'data'],
  tactics,
  metrics,
  min_team_size: 3,
  min_monthly_budget_usd: 2000,
  priority: 1,
};
