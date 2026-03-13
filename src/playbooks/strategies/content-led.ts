// One Agent Corp — Content-Led Growth Playbook
// Domain D-6: SEO, thought leadership, educational content funnel

import type { Playbook, Tactic, GrowthMetric } from '../types';

// ─── Metrics ──────────────────────────────────────────────────────────────────

const metrics: GrowthMetric[] = [
  {
    id: 'organic_traffic_monthly',
    name: 'Monthly Organic Traffic',
    description: 'Unique visitors arriving via organic search channels per month',
    formula: 'sum(organic_search_sessions) in 30-day window',
    target: 5000,
    operator: '>=',
    unit: 'count',
    frequency: 'monthly',
    owner: 'growth',
  },
  {
    id: 'articles_published_per_week',
    name: 'Articles Published Per Week',
    description: 'Number of original SEO-targeted articles published weekly',
    formula: 'count(published_articles) in 7-day window',
    target: 2,
    operator: '>=',
    unit: 'count',
    frequency: 'weekly',
    owner: 'growth',
  },
  {
    id: 'content_to_trial_conversion',
    name: 'Content-to-Trial Conversion Rate',
    description: 'Percentage of content page visitors who start a trial within 30 days',
    formula: 'trial_starts_attributed_to_content / content_page_visitors * 100',
    target: 3,
    operator: '>=',
    unit: 'percentage',
    frequency: 'monthly',
    owner: 'data',
  },
  {
    id: 'domain_authority',
    name: 'Domain Authority Score',
    description: 'Moz/Ahrefs domain authority reflecting SEO strength of the content hub',
    formula: 'domain_authority_score from SEO tool',
    target: 40,
    operator: '>=',
    unit: 'score',
    frequency: 'monthly',
    owner: 'growth',
  },
  {
    id: 'email_subscribers',
    name: 'Newsletter Subscribers',
    description: 'Total active email subscribers who opted in via content (not trial)',
    formula: 'count(active_newsletter_subscribers)',
    target: 1000,
    operator: '>=',
    unit: 'count',
    frequency: 'monthly',
    owner: 'growth',
  },
];

// ─── Tactics ──────────────────────────────────────────────────────────────────

const tactics: Tactic[] = [
  {
    id: 'content_calendar_setup',
    name: 'Content Calendar Setup',
    description: 'Build a 90-day content calendar targeting high-intent keywords: problem-aware, solution-aware, and competitor-aware content',
    owner_department: 'growth',
    supporting_departments: ['product', 'data'],
    effort: 'medium',
    timeline_days: 7,
    success_metric: 'articles_published_per_week',
    expected_roi: 'Systematic calendar produces 2+ articles/week consistently; compounds over 6 months to 10K+ monthly organic visits',
    prerequisites: [],
    execute: (config) => ({
      department: 'growth',
      payload: {
        action: 'setup_content_calendar',
        objective: `Establish 90-day content calendar publishing >= 2 articles/week for ${config.project.name}`,
        deadline: (() => {
          const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString();
        })(),
        resources: ['ahrefs_or_semrush', 'content_writer', 'notion_or_airtable'],
        kpi_targets: { articles_published_per_week: 2 },
        context: {
          content_pillars: [
            'how-to guides targeting {product_category} keywords',
            'comparison pages: {product} vs {competitor}',
            'use-case spotlights: {product} for {industry}',
            'educational series: mastering {domain}',
          ],
          keyword_criteria: { monthly_volume_min: 500, keyword_difficulty_max: 60, intent: 'informational_and_commercial' },
          publishing_workflow: 'keyword_research → brief → draft → review → publish → distribute',
          project: config.project.name,
        },
      },
    }),
  },
  {
    id: 'seo_hub_architecture',
    name: 'SEO Content Hub Architecture',
    description: 'Build topic clusters: one pillar page per core topic, supported by 5-10 cluster articles. Internal linking structure boosts domain authority.',
    owner_department: 'growth',
    supporting_departments: ['engineering', 'data'],
    effort: 'high',
    timeline_days: 30,
    success_metric: 'domain_authority',
    expected_roi: 'Topic clusters outperform individual articles by 3-5x in search ranking; DA 40+ unlocks competitive keywords',
    prerequisites: ['content_calendar_setup'],
    execute: (config) => ({
      department: 'growth',
      payload: {
        action: 'build_seo_content_hub',
        objective: `Build topic cluster architecture for ${config.project.name} targeting DA >= 40 in 6 months`,
        deadline: (() => {
          const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString();
        })(),
        resources: ['cms_platform', 'seo_tool_subscription', 'technical_seo_audit'],
        kpi_targets: { domain_authority: 40, organic_traffic_monthly: 5000 },
        context: {
          hub_structure: {
            pillar_pages: 3,
            cluster_articles_per_pillar: 8,
            internal_links_per_article: 5,
          },
          technical_requirements: ['schema_markup', 'page_speed_90plus', 'mobile_first', 'canonical_tags', 'sitemap_xml'],
          backlink_strategy: 'HARO + guest posts on industry publications',
          project: config.project.name,
        },
      },
    }),
  },
  {
    id: 'lead_magnet_creation',
    name: 'Lead Magnets & Email List Building',
    description: 'Create 3-5 high-value lead magnets (templates, calculators, checklists) gated behind email capture to build owned audience',
    owner_department: 'growth',
    supporting_departments: ['product', 'operations'],
    effort: 'medium',
    timeline_days: 14,
    success_metric: 'email_subscribers',
    expected_roi: 'Email subscribers have 5-10x higher trial conversion than anonymous visitors; owned channel immune to algorithm changes',
    prerequisites: ['content_calendar_setup'],
    execute: (config) => ({
      department: 'growth',
      payload: {
        action: 'create_lead_magnets',
        objective: `Build email list to >= 1000 subscribers for ${config.project.name} via gated lead magnets`,
        deadline: (() => {
          const d = new Date(); d.setDate(d.getDate() + 14); return d.toISOString();
        })(),
        resources: ['design_tool', 'email_platform', 'landing_page_builder'],
        kpi_targets: { email_subscribers: 1000 },
        context: {
          lead_magnet_types: [
            { type: 'template', title: '{Product} Starter Kit — 10 ready-to-use templates' },
            { type: 'calculator', title: 'ROI Calculator: How much {problem} costs your team' },
            { type: 'checklist', title: 'The {industry} Checklist: 30 things to do before {goal}' },
            { type: 'mini_course', title: '5-day email course: {core_skill} for {role}' },
          ],
          distribution: ['content_page_inline_cta', 'exit_intent_popup', 'social_media_promotion'],
          nurture_sequence_days: [0, 3, 7, 14, 30],
          project: config.project.name,
        },
      },
    }),
  },
  {
    id: 'thought_leadership_distribution',
    name: 'Thought Leadership & Content Distribution',
    description: 'Repurpose long-form content into LinkedIn posts, Twitter threads, podcast appearances, and guest articles on industry publications',
    owner_department: 'growth',
    supporting_departments: ['sales', 'operations'],
    effort: 'low',
    timeline_days: 7,
    success_metric: 'content_to_trial_conversion',
    expected_roi: 'Multi-channel distribution multiplies content reach by 5-10x; LinkedIn organic reach drives B2B decision-maker awareness',
    prerequisites: ['content_calendar_setup'],
    execute: (config) => ({
      department: 'growth',
      payload: {
        action: 'distribute_thought_leadership',
        objective: `Distribute ${config.project.name} content across 5+ channels to achieve >= 3% content-to-trial conversion`,
        deadline: (() => {
          const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString();
        })(),
        resources: ['buffer_or_hootsuite', 'podcast_outreach_list', 'guest_post_targets'],
        kpi_targets: { content_to_trial_conversion: 3, organic_traffic_monthly: 5000 },
        context: {
          repurposing_workflow: 'long_form → linkedin_post → twitter_thread → short_video → email_newsletter',
          distribution_channels: ['linkedin', 'twitter_x', 'hacker_news', 'reddit_relevant_subs', 'industry_newsletters'],
          guest_post_targets: 'publications with DA >= 50 and audience overlap >= 60%',
          cta_in_content: 'soft CTA to trial, never hard sell',
          project: config.project.name,
        },
      },
    }),
  },
];

// ─── Playbook Export ──────────────────────────────────────────────────────────

export const contentLedPlaybook: Playbook = {
  id: 'content-led',
  name: 'Content-Led Growth',
  description: 'Build a compounding organic engine: SEO content hub targeting high-intent keywords, lead magnets to capture emails, and thought leadership to build brand authority. Best for B2B SaaS where buyers research before buying.',
  stage_applicable: ['ideation', 'validation', 'mvp', 'launch', 'growth'],
  target_markets: ['B2B SaaS', 'Developer Tools', 'Enterprise'],
  departments_involved: ['growth', 'product', 'engineering', 'data', 'operations'],
  tactics,
  metrics,
  min_team_size: 2,
  min_monthly_budget_usd: 1000,
  priority: 4,
};
