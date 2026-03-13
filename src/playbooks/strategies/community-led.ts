// One Agent Corp — Community-Led Growth Playbook
// Domain D-6: Community building, user advocacy, peer support

import type { Playbook, Tactic, GrowthMetric } from '../types';

// ─── Metrics ──────────────────────────────────────────────────────────────────

const metrics: GrowthMetric[] = [
  {
    id: 'community_members',
    name: 'Active Community Members',
    description: 'Number of members who participated (posted, commented, or reacted) in the last 30 days',
    formula: 'count(members_with_activity_in_30d)',
    target: 500,
    operator: '>=',
    unit: 'count',
    frequency: 'monthly',
    owner: 'growth',
  },
  {
    id: 'community_sourced_signups',
    name: 'Community-Sourced Signups',
    description: 'Trial signups attributed to community channels (Slack, Discord, forum posts)',
    formula: 'signups_with_utm_source_community in 30 days',
    target: 30,
    operator: '>=',
    unit: 'count',
    frequency: 'monthly',
    owner: 'data',
  },
  {
    id: 'community_retention_lift',
    name: 'Community-Member Retention Lift',
    description: '90-day retention rate of community members vs non-members (percentage point delta)',
    formula: 'retention_90d_community_members - retention_90d_non_members',
    target: 20,
    operator: '>=',
    unit: 'percentage',
    frequency: 'monthly',
    owner: 'data',
  },
  {
    id: 'peer_support_resolution_rate',
    name: 'Peer Support Resolution Rate',
    description: 'Percentage of support questions answered by community members (not the company)',
    formula: 'questions_answered_by_peers / total_community_questions * 100',
    target: 60,
    operator: '>=',
    unit: 'percentage',
    frequency: 'weekly',
    owner: 'operations',
  },
  {
    id: 'user_generated_content',
    name: 'User-Generated Content (UGC) per Month',
    description: 'Templates, tutorials, integrations, or showcases created by community members and shared publicly',
    formula: 'count(ugc_published_by_members_in_30d)',
    target: 10,
    operator: '>=',
    unit: 'count',
    frequency: 'monthly',
    owner: 'growth',
  },
];

// ─── Tactics ──────────────────────────────────────────────────────────────────

const tactics: Tactic[] = [
  {
    id: 'community_platform_launch',
    name: 'Community Platform Launch',
    description: 'Choose and launch the right community platform (Slack for real-time, Discourse/Circle for async, Discord for dev tools). Seed with 50 founding members before public launch.',
    owner_department: 'growth',
    supporting_departments: ['operations', 'product'],
    effort: 'medium',
    timeline_days: 14,
    success_metric: 'community_members',
    expected_roi: 'Active community reduces support tickets by 30-40%; becomes organic acquisition channel within 6 months',
    prerequisites: [],
    execute: (config) => ({
      department: 'growth',
      payload: {
        action: 'launch_community_platform',
        objective: `Launch ${config.project.name} community with 50 founding members in week 1, 500 active in 90 days`,
        deadline: (() => {
          const d = new Date(); d.setDate(d.getDate() + 14); return d.toISOString();
        })(),
        resources: ['community_platform_subscription', 'community_manager', 'founding_member_budget'],
        kpi_targets: { community_members: 500 },
        context: {
          platform_selection: {
            B2B_enterprise: 'Slack or Microsoft Teams',
            Developer_tools: 'Discord or GitHub Discussions',
            Consumer: 'Circle or Mighty Networks',
          },
          founding_member_strategy: 'invite top 50 power users from trial list personally from CEO',
          launch_channels: ['#general', '#showcase', '#help', '#roadmap', '#random'],
          moderation_rules: 'published in channel on day 1, pinned',
          project: config.project.name,
        },
      },
    }),
  },
  {
    id: 'ambassador_program',
    name: 'User Ambassador Program',
    description: 'Identify and activate power users as paid/rewarded ambassadors: early access, co-marketing, speaking opportunities, swag',
    owner_department: 'growth',
    supporting_departments: ['sales', 'product'],
    effort: 'medium',
    timeline_days: 21,
    success_metric: 'user_generated_content',
    expected_roi: 'Ambassadors produce 10+ UGC items/month and refer 2-5 new customers each; highest-trust acquisition channel',
    prerequisites: ['community_platform_launch'],
    execute: (config) => ({
      department: 'growth',
      payload: {
        action: 'launch_ambassador_program',
        objective: `Recruit 20 ambassadors for ${config.project.name} who generate >= 10 UGC items/month collectively`,
        deadline: (() => {
          const d = new Date(); d.setDate(d.getDate() + 21); return d.toISOString();
        })(),
        resources: ['ambassador_budget_usd_500_mo', 'swag_inventory', 'co_marketing_calendar'],
        kpi_targets: { user_generated_content: 10, community_sourced_signups: 30 },
        context: {
          ambassador_tiers: [
            { tier: 'Champion', requirements: '6+ months active, 50+ community posts', perks: ['free_pro_plan', 'beta_access', 'co_marketing'] },
            { tier: 'Advocate', requirements: '3+ months active, 20+ posts, referral', perks: ['free_pro_plan', 'swag'] },
          ],
          ugc_types: ['tutorial_videos', 'template_library', 'use_case_blog_posts', 'integration_builds', 'show_and_tell_demos'],
          ambassador_activities: ['weekly_office_hours', 'monthly_call_with_ceo', 'product_roadmap_input'],
          project: config.project.name,
        },
      },
    }),
  },
  {
    id: 'peer_support_framework',
    name: 'Peer Support Framework',
    description: 'Design community so members answer 60%+ of questions. Gamification: points, badges, leaderboards. First-response SLA for unanswered questions.',
    owner_department: 'operations',
    supporting_departments: ['engineering', 'growth'],
    effort: 'low',
    timeline_days: 7,
    success_metric: 'peer_support_resolution_rate',
    expected_roi: 'Peer support at 60%+ resolution reduces CS headcount needs by 40%; improves response time by 5x',
    prerequisites: ['community_platform_launch'],
    execute: (config) => ({
      department: 'operations',
      payload: {
        action: 'implement_peer_support_framework',
        objective: `Achieve >= 60% peer-resolution rate in ${config.project.name} community within 30 days`,
        deadline: (() => {
          const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString();
        })(),
        resources: ['community_platform_api', 'gamification_plugin', 'bot_for_tagging'],
        kpi_targets: { peer_support_resolution_rate: 60 },
        context: {
          gamification: {
            points: { answer_accepted: 10, answer_marked_helpful: 3, question_asked: 1 },
            badges: ['First Answer', 'Helpful x10', 'Expert', 'Top Contributor'],
            leaderboard: 'monthly_reset_with_prizes',
          },
          escalation_rule: 'if_no_response_in_4h_ping_expert_members, in_24h_ping_support_team',
          tagging_system: 'auto-tag questions by product area for routing to right experts',
          project: config.project.name,
        },
      },
    }),
  },
  {
    id: 'community_events_calendar',
    name: 'Community Events & Live Engagement',
    description: 'Monthly live events: product demos, expert webinars, office hours with founders, community showcases, virtual meetups',
    owner_department: 'growth',
    supporting_departments: ['product', 'sales'],
    effort: 'medium',
    timeline_days: 14,
    success_metric: 'community_retention_lift',
    expected_roi: 'Members who attend events have 2x retention vs those who do not; events generate community-sourced signups via social sharing',
    prerequisites: ['community_platform_launch'],
    execute: (config) => ({
      department: 'growth',
      payload: {
        action: 'establish_community_events_calendar',
        objective: `Run monthly live events for ${config.project.name} community to achieve >= 20pp retention lift among members`,
        deadline: (() => {
          const d = new Date(); d.setDate(d.getDate() + 14); return d.toISOString();
        })(),
        resources: ['zoom_or_streamyard', 'event_promotion_budget', 'guest_speaker_outreach'],
        kpi_targets: { community_retention_lift: 20, community_members: 500 },
        context: {
          event_cadence: {
            weekly: 'office_hours_with_team_30min',
            monthly: 'product_roadmap_preview_and_qa',
            quarterly: 'community_showcase_and_awards',
          },
          event_formats: ['live_demo', 'ama_with_founder', 'expert_guest_webinar', 'power_user_showcase'],
          recording_policy: 'all_events_recorded_and_posted_to_community_within_24h',
          project: config.project.name,
        },
      },
    }),
  },
];

// ─── Playbook Export ──────────────────────────────────────────────────────────

export const communityLedPlaybook: Playbook = {
  id: 'community-led',
  name: 'Community-Led Growth',
  description: 'Build a self-sustaining community that drives acquisition via word-of-mouth, reduces churn through belonging, and scales support via peers. Strongest moat for products with strong use-case identity.',
  stage_applicable: ['launch', 'growth', 'scale'],
  target_markets: ['Developer Tools', 'B2B SaaS', 'Prosumer', 'Marketplace'],
  departments_involved: ['growth', 'product', 'operations', 'sales', 'engineering'],
  tactics,
  metrics,
  min_team_size: 2,
  min_monthly_budget_usd: 1000,
  priority: 5,
};
