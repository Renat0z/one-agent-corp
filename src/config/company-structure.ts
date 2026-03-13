// One Agent Corp — Company Structure
// Central configuration that assembles the full organization from department YAMLs
// Domain D-1: Organizational Structure & Departments

import type {
  Organization,
  OrganizationConfig,
  Department,
  DepartmentId,
  DepartmentInteraction,
  KPI,
} from '../types/organization';

// ─── Department Definitions (inline, mirrors YAML configs) ───────────────────
// In production, these would be loaded from YAML files via loadDepartments().
// Here they are defined as typed objects for zero-dependency boot.

const productDepartment: Department = {
  id: 'product',
  name: 'Product Department',
  mission: 'Identificar oportunidades de mercado, validar ideias e definir roadmaps para micro-SaaS de alto crescimento.',
  persona: {
    name: 'Lucas Ferreira',
    title: 'VP of Product',
    role: 'Head of Product',
    communication_style: 'visionary',
    objectives: [
      'Lancar 2+ micro-SaaS validados por trimestre',
      'Manter NPS acima de 50 em todos os produtos',
      'Reduzir time-to-market de ideia a MVP para menos de 4 semanas',
    ],
    strengths: [
      'Descoberta de produto baseada em dados',
      'Priorizacao ruthless via RICE scoring',
      'User research rapida com prototipos',
    ],
    decision_bias: 'Favorece velocidade sobre perfeicao — ship fast, iterate faster',
  },
  responsibilities: [
    'Conduzir discovery e validacao de novas ideias de micro-SaaS',
    'Definir e priorizar roadmap usando RICE framework',
    'Gerenciar backlog e grooming com Engineering',
    'Conduzir user interviews e analisar feedback',
    'Definir criterios de go/no-go para cada stage do pipeline',
    'Manter product-market fit score atualizado',
  ],
  kpis: [
    { id: 'prod_time_to_mvp', name: 'Time to MVP', formula: 'date(mvp_ready) - date(idea_approved)', target: 28, unit: 'days', frequency: 'monthly', owner: 'product', shared_with: ['engineering'] },
    { id: 'prod_nps', name: 'Net Promoter Score', formula: '(%promoters - %detractors) * 100', target: 50, unit: 'score', frequency: 'quarterly', owner: 'product', shared_with: ['growth', 'sales'] },
    { id: 'prod_ideas_validated', name: 'Ideas Validated per Quarter', formula: "count(ideas where status = 'validated')", target: 8, unit: 'count', frequency: 'quarterly', owner: 'product' },
    { id: 'prod_feature_adoption', name: 'Feature Adoption Rate', formula: '(users_using_feature / total_active_users) * 100', target: 40, unit: 'percentage', frequency: 'monthly', owner: 'product', shared_with: ['data', 'growth'] },
  ],
  interactions: [
    { from: 'product', to: 'engineering', type: 'dependency', frequency: 'daily', topics: ['Sprint planning e backlog refinement', 'Estimativas tecnicas para features', 'Bug triage e priorizacao'], escalation_path: 'Product → CEO se Engineering nao consegue entregar no prazo' },
    { from: 'product', to: 'growth', type: 'collaboration', frequency: 'weekly', topics: ['Metricas de adocao de features', 'Feedback de usuarios para roadmap', 'Estrategia de lancamento'], escalation_path: 'Product → CEO se Growth precisa de features urgentes nao planejadas' },
    { from: 'product', to: 'data', type: 'dependency', frequency: 'weekly', topics: ['Analise de comportamento de usuarios', 'Validacao de hipoteses com dados', 'Metricas de product-market fit'], escalation_path: 'Product → CEO se dados insuficientes para decisao' },
    { from: 'product', to: 'sales', type: 'collaboration', frequency: 'bi-weekly', topics: ['Feedback de clientes enterprise', 'Feature requests de prospects', 'Pricing strategy'], escalation_path: 'Product → CEO se conflito entre roadmap e demanda de vendas' },
  ],
  escalation_path: 'Product Head → CEO (via escalation message)',
  tools: ['RICE Scoring Framework', 'User Interview Templates', 'Product-Market Fit Survey', 'Roadmap Prioritization Matrix', 'Competitive Analysis Templates'],
  autonomy_level: 'high',
};

const engineeringDepartment: Department = {
  id: 'engineering',
  name: 'Engineering Department',
  mission: 'Construir, deployar e manter micro-SaaS com qualidade, velocidade e custo baixo.',
  persona: {
    name: 'Rafael Nakamura',
    title: 'VP of Engineering',
    role: 'Head of Engineering',
    communication_style: 'analytical',
    objectives: [
      'Manter deploy frequency >= 2x por semana por produto',
      'Manter uptime >= 99.5% em todos os servicos',
      'Reduzir lead time de commit a producao para < 24h',
    ],
    strengths: [
      'Arquitetura pragmatica — minimo viavel, maximo escalavel',
      'CI/CD pipeline otimizado',
      'Debt management disciplinado',
    ],
    decision_bias: 'Prefere solucoes simples e testadas sobre cutting-edge; tech debt e pago religiosamente',
  },
  responsibilities: [
    'Implementar features definidas pelo Product',
    'Manter infraestrutura e CI/CD pipelines',
    'Code review e qualidade de codigo',
    'Gerenciar tech debt e refatoracoes',
    'Monitoramento e incident response',
    'Documentacao tecnica e ADRs',
  ],
  kpis: [
    { id: 'eng_deploy_frequency', name: 'Deploy Frequency', formula: 'count(deploys) / weeks_in_period', target: 2, unit: 'count', frequency: 'weekly', owner: 'engineering' },
    { id: 'eng_uptime', name: 'Service Uptime', formula: '(total_minutes - downtime_minutes) / total_minutes * 100', target: 99.5, unit: 'percentage', frequency: 'monthly', owner: 'engineering', shared_with: ['operations'] },
    { id: 'eng_lead_time', name: 'Lead Time to Production', formula: 'avg(date(deployed) - date(committed))', target: 24, unit: 'days', frequency: 'weekly', owner: 'engineering', shared_with: ['product'] },
    { id: 'eng_bug_escape_rate', name: 'Bug Escape Rate', formula: '(bugs_found_in_prod / total_bugs_found) * 100', target: 10, unit: 'percentage', frequency: 'monthly', owner: 'engineering', shared_with: ['product'] },
    { id: 'eng_test_coverage', name: 'Test Coverage', formula: '(lines_covered / total_lines) * 100', target: 80, unit: 'percentage', frequency: 'weekly', owner: 'engineering' },
  ],
  interactions: [
    { from: 'engineering', to: 'product', type: 'dependency', frequency: 'daily', topics: ['Requirements clarification', 'Technical feasibility feedback', 'Sprint progress updates'], escalation_path: 'Engineering → CEO se escopo muda mid-sprint sem acordo' },
    { from: 'engineering', to: 'operations', type: 'collaboration', frequency: 'weekly', topics: ['Infrastructure provisioning', 'Cost optimization', 'Security compliance'], escalation_path: 'Engineering → CEO se custo de infra excede budget' },
    { from: 'engineering', to: 'data', type: 'collaboration', frequency: 'weekly', topics: ['Event tracking implementation', 'Data pipeline integrations', 'Analytics SDK setup'], escalation_path: 'Engineering → CEO se data pipeline impacta performance' },
    { from: 'engineering', to: 'growth', type: 'advisory', frequency: 'bi-weekly', topics: ['A/B test implementation', 'Performance optimization for conversions', 'Technical SEO requirements'], escalation_path: 'Engineering → CEO se growth requests impactam stabilidade' },
  ],
  escalation_path: 'Engineering Head → CEO (via escalation message)',
  tools: ['GitHub/Git Version Control', 'CI/CD Pipeline (automated)', 'Monitoring & Alerting Stack', 'Architecture Decision Records', 'Tech Debt Tracker'],
  autonomy_level: 'high',
};

const growthDepartment: Department = {
  id: 'growth',
  name: 'Growth & Marketing Department',
  mission: 'Acelerar aquisicao, ativacao e retencao de usuarios via experimentos data-driven e growth hacking.',
  persona: {
    name: 'Camila Santos',
    title: 'VP of Growth',
    role: 'Head of Growth & Marketing',
    communication_style: 'direct',
    objectives: [
      'Atingir MRR growth >= 15% MoM em produtos ativos',
      'Reduzir CAC para < 1/3 do LTV',
      'Rodar minimo 10 experimentos de growth por mes',
    ],
    strengths: [
      'Growth loops e viral mechanics',
      'Copywriting de alta conversao',
      'Experimentacao rapida com analise rigorosa',
    ],
    decision_bias: 'Se nao da pra medir, nao faz. Prioriza canais com payback < 3 meses',
  },
  responsibilities: [
    'Definir e executar estrategia de aquisicao de usuarios',
    'Rodar experimentos de growth (A/B tests, landing pages, funnels)',
    'Gerenciar canais: SEO, content, social, paid, referral',
    'Otimizar onboarding e ativacao de novos usuarios',
    'Monitorar e reduzir churn',
    'Criar e executar playbooks de growth hacking',
  ],
  kpis: [
    { id: 'growth_mrr_growth', name: 'MRR Growth Rate', formula: '((mrr_current - mrr_previous) / mrr_previous) * 100', target: 15, unit: 'percentage', frequency: 'monthly', owner: 'growth', shared_with: ['sales', 'data'] },
    { id: 'growth_cac', name: 'Customer Acquisition Cost', formula: 'total_marketing_spend / new_customers_acquired', target: 50, unit: 'currency_usd', frequency: 'monthly', owner: 'growth', shared_with: ['sales', 'operations'] },
    { id: 'growth_experiments', name: 'Experiments Run per Month', formula: "count(experiments where status = 'completed')", target: 10, unit: 'count', frequency: 'monthly', owner: 'growth' },
    { id: 'growth_activation_rate', name: 'User Activation Rate', formula: '(users_completed_onboarding / total_signups) * 100', target: 60, unit: 'percentage', frequency: 'weekly', owner: 'growth', shared_with: ['product', 'data'] },
    { id: 'growth_viral_coefficient', name: 'Viral Coefficient', formula: 'avg_invites_per_user * invite_conversion_rate', target: 1.2, unit: 'ratio', frequency: 'monthly', owner: 'growth' },
  ],
  interactions: [
    { from: 'growth', to: 'product', type: 'collaboration', frequency: 'weekly', topics: ['Feature adoption metrics', 'Onboarding flow improvements', 'User feedback from campaigns'], escalation_path: 'Growth → CEO se product changes bloqueiam growth experiments' },
    { from: 'growth', to: 'engineering', type: 'dependency', frequency: 'bi-weekly', topics: ['A/B test implementation', 'Landing page deploys', 'Tracking pixel and analytics setup'], escalation_path: 'Growth → CEO se engineering backlog bloqueia experimentos criticos' },
    { from: 'growth', to: 'sales', type: 'collaboration', frequency: 'weekly', topics: ['Lead quality from campaigns', 'MQL to SQL conversion rates', 'Joint campaign planning'], escalation_path: 'Growth → CEO se leads gerados nao convertem e Sales contesta qualidade' },
    { from: 'growth', to: 'data', type: 'dependency', frequency: 'daily', topics: ['Experiment analysis and statistical significance', 'Funnel analytics', 'Cohort analysis for retention'], escalation_path: 'Growth → CEO se data delays impedem decisao de scale/kill' },
  ],
  escalation_path: 'Growth Head → CEO (via escalation message)',
  tools: ['A/B Testing Framework', 'Funnel Analytics Dashboard', 'SEO & Content Toolkit', 'Social Media Scheduler', 'Referral Program Engine', 'Email Automation Platform'],
  autonomy_level: 'high',
};

const salesDepartment: Department = {
  id: 'sales',
  name: 'Sales Department',
  mission: 'Converter leads em clientes pagantes e expandir receita por conta.',
  persona: {
    name: 'Andre Oliveira',
    title: 'VP of Sales',
    role: 'Head of Sales',
    communication_style: 'direct',
    objectives: [
      'Atingir revenue growth >= 10% QoQ',
      'Manter win rate >= 25% em pipeline qualificado',
      'Expandir ARPU em 20% via upsell/cross-sell',
    ],
    strengths: [
      'Consultative selling para SaaS',
      'Pipeline management disciplinado',
      'Expansao de contas existentes',
    ],
    decision_bias: 'Revenue first — prioriza deals com maior LTV potencial, evita desconto excessivo',
  },
  responsibilities: [
    'Qualificar e converter leads gerados pelo Growth',
    'Gerenciar pipeline de vendas end-to-end',
    'Conduzir demos e calls de fechamento',
    'Executar estrategias de upsell e cross-sell',
    'Manter relacionamento com clientes enterprise',
    'Fornecer feedback de mercado para Product e Growth',
  ],
  kpis: [
    { id: 'sales_revenue_growth', name: 'Revenue Growth QoQ', formula: '((revenue_current_q - revenue_prev_q) / revenue_prev_q) * 100', target: 10, unit: 'percentage', frequency: 'quarterly', owner: 'sales', shared_with: ['growth', 'operations'] },
    { id: 'sales_win_rate', name: 'Win Rate', formula: '(deals_won / total_qualified_opportunities) * 100', target: 25, unit: 'percentage', frequency: 'monthly', owner: 'sales' },
    { id: 'sales_arpu', name: 'Average Revenue Per User', formula: 'total_revenue / total_active_customers', target: 75, unit: 'currency_usd', frequency: 'monthly', owner: 'sales', shared_with: ['growth', 'data'] },
    { id: 'sales_cycle_length', name: 'Average Sales Cycle', formula: 'avg(date(deal_closed) - date(lead_qualified))', target: 14, unit: 'days', frequency: 'monthly', owner: 'sales' },
    { id: 'sales_expansion_revenue', name: 'Expansion Revenue Rate', formula: '(upsell_revenue + crosssell_revenue) / total_revenue * 100', target: 20, unit: 'percentage', frequency: 'quarterly', owner: 'sales', shared_with: ['product'] },
  ],
  interactions: [
    { from: 'sales', to: 'growth', type: 'dependency', frequency: 'weekly', topics: ['Lead volume and quality', 'Campaign alignment', 'MQL handoff criteria'], escalation_path: 'Sales → CEO se lead volume insuficiente para atingir quota' },
    { from: 'sales', to: 'product', type: 'collaboration', frequency: 'bi-weekly', topics: ['Feature requests from prospects', 'Competitive gaps', 'Pricing feedback'], escalation_path: 'Sales → CEO se feature gap causa perda recorrente de deals' },
    { from: 'sales', to: 'data', type: 'dependency', frequency: 'weekly', topics: ['Pipeline analytics', 'Win/loss analysis', 'Customer segmentation'], escalation_path: 'Sales → CEO se falta de dados impede forecast confiavel' },
    { from: 'sales', to: 'operations', type: 'reporting', frequency: 'monthly', topics: ['Revenue reporting', 'Commission calculation', 'Contract management'], escalation_path: 'Sales → CEO se operational bottleneck atrasa onboarding de cliente' },
  ],
  escalation_path: 'Sales Head → CEO (via escalation message)',
  tools: ['CRM Pipeline Manager', 'Demo & Presentation Templates', 'Proposal Generator', 'Win/Loss Analysis Framework', 'Upsell Playbook'],
  autonomy_level: 'high',
};

const dataDepartment: Department = {
  id: 'data',
  name: 'Data & Analytics Department',
  mission: 'Transformar dados em decisoes. Cada dashboard, analise e modelo serve para acelerar uma decisao de outro departamento.',
  persona: {
    name: 'Priya Sharma',
    title: 'VP of Data & Analytics',
    role: 'Head of Data',
    communication_style: 'analytical',
    objectives: [
      'Garantir que 100% das decisoes estrategicas sao data-informed',
      'Entregar insights acionaveis em < 48h de qualquer request',
      'Manter data freshness < 1h para metricas criticas',
    ],
    strengths: [
      'Statistical rigor sem paralysis by analysis',
      'Storytelling com dados',
      'Self-service analytics para outros departamentos',
    ],
    decision_bias: 'Dados falam mais alto — mas dados atrasados valem menos. Prioriza velocidade com rigor suficiente',
  },
  responsibilities: [
    'Manter data warehouse e pipelines de dados',
    'Criar e manter dashboards para todos os departamentos',
    'Analisar experimentos de Growth com rigor estatistico',
    'Fornecer customer insights para Product e Sales',
    'Modelar previsoes de receita e churn',
    'Garantir data quality e governance',
  ],
  kpis: [
    { id: 'data_insight_turnaround', name: 'Insight Turnaround Time', formula: 'avg(date(insight_delivered) - date(request_received))', target: 48, unit: 'hours', frequency: 'weekly', owner: 'data' },
    { id: 'data_freshness', name: 'Critical Data Freshness', formula: 'max(now() - last_update) for critical_metrics', target: 1, unit: 'days', frequency: 'daily', owner: 'data', shared_with: ['operations'] },
    { id: 'data_dashboard_adoption', name: 'Dashboard Adoption Rate', formula: '(departments_using_dashboards / total_departments) * 100', target: 100, unit: 'percentage', frequency: 'monthly', owner: 'data' },
    { id: 'data_experiment_analysis', name: 'Experiments Analyzed on Time', formula: '(experiments_analyzed_within_sla / total_experiments) * 100', target: 90, unit: 'percentage', frequency: 'monthly', owner: 'data', shared_with: ['growth'] },
    { id: 'data_prediction_accuracy', name: 'Revenue Prediction Accuracy', formula: '(1 - abs(predicted - actual) / actual) * 100', target: 85, unit: 'percentage', frequency: 'quarterly', owner: 'data', shared_with: ['sales', 'operations'] },
  ],
  interactions: [
    { from: 'data', to: 'growth', type: 'collaboration', frequency: 'daily', topics: ['Experiment results and significance', 'Funnel analysis', 'Cohort retention curves'], escalation_path: 'Data → CEO se Growth ignora resultados estatisticamente significativos' },
    { from: 'data', to: 'product', type: 'advisory', frequency: 'weekly', topics: ['User behavior analytics', 'Feature usage metrics', 'Product-market fit scoring'], escalation_path: 'Data → CEO se decisoes de produto contradizem dados claros' },
    { from: 'data', to: 'sales', type: 'advisory', frequency: 'weekly', topics: ['Pipeline forecast models', 'Customer segmentation', 'Churn prediction alerts'], escalation_path: 'Data → CEO se forecast diverge significativamente da realidade' },
    { from: 'data', to: 'operations', type: 'reporting', frequency: 'weekly', topics: ['Cost analytics', 'Infrastructure usage metrics', 'Operational efficiency KPIs'], escalation_path: 'Data → CEO se data infra costs crescem desproporcionalmente' },
  ],
  escalation_path: 'Data Head → CEO (via escalation message)',
  tools: ['SQL Query Engine', 'Dashboard Builder', 'Statistical Analysis Toolkit', 'Data Pipeline Monitor', 'Prediction Model Framework', 'Data Quality Scanner'],
  autonomy_level: 'medium',
};

const operationsDepartment: Department = {
  id: 'operations',
  name: 'Operations Department',
  mission: 'Manter a maquina rodando. Financas, compliance, infra, processos — tudo que permite aos outros departamentos focar no que importa.',
  persona: {
    name: 'Diana Almeida',
    title: 'VP of Operations',
    role: 'Head of Operations',
    communication_style: 'pragmatic',
    objectives: [
      'Manter burn rate dentro de 90% do budget planejado',
      'Garantir zero incidents de compliance',
      'Automatizar 80%+ dos processos operacionais repetitivos',
    ],
    strengths: [
      'Process optimization obsessiva',
      'Cost management sem cortar crescimento',
      'Risk mitigation proativa',
    ],
    decision_bias: 'Eficiencia sem burocracia — automatiza tudo que pode, escala o que nao pode',
  },
  responsibilities: [
    'Gerenciar budget e financas da empresa',
    'Garantir compliance legal e regulatorio',
    'Provisionar e gerenciar infraestrutura',
    'Automatizar processos operacionais',
    'Gerenciar vendor relationships',
    'Monitorar burn rate e runway',
  ],
  kpis: [
    { id: 'ops_burn_rate_accuracy', name: 'Burn Rate vs Budget', formula: '(actual_spend / planned_budget) * 100', target: 90, unit: 'percentage', frequency: 'monthly', owner: 'operations' },
    { id: 'ops_compliance_incidents', name: 'Compliance Incidents', formula: 'count(compliance_violations)', target: 0, unit: 'count', frequency: 'monthly', owner: 'operations' },
    { id: 'ops_process_automation', name: 'Process Automation Rate', formula: '(automated_processes / total_processes) * 100', target: 80, unit: 'percentage', frequency: 'quarterly', owner: 'operations' },
    { id: 'ops_infra_cost_per_user', name: 'Infrastructure Cost per User', formula: 'total_infra_cost / total_active_users', target: 2, unit: 'currency_usd', frequency: 'monthly', owner: 'operations', shared_with: ['engineering', 'data'] },
    { id: 'ops_vendor_spend_efficiency', name: 'Vendor Spend Efficiency', formula: '(value_delivered_score / total_vendor_spend) * 100', target: 75, unit: 'percentage', frequency: 'quarterly', owner: 'operations' },
  ],
  interactions: [
    { from: 'operations', to: 'engineering', type: 'collaboration', frequency: 'weekly', topics: ['Infrastructure costs and optimization', 'Security patches and compliance', 'Capacity planning'], escalation_path: 'Operations → CEO se custo de infra excede threshold sem aprovacao' },
    { from: 'operations', to: 'sales', type: 'reporting', frequency: 'monthly', topics: ['Revenue reconciliation', 'Contract compliance', 'Billing issues'], escalation_path: 'Operations → CEO se revenue reconciliation diverge > 5%' },
    { from: 'operations', to: 'growth', type: 'advisory', frequency: 'monthly', topics: ['Marketing budget tracking', 'CAC vs budget alignment', 'Vendor contract renewals'], escalation_path: 'Operations → CEO se marketing spend excede budget sem ROI claro' },
    { from: 'operations', to: 'data', type: 'dependency', frequency: 'weekly', topics: ['Financial reporting data', 'Operational metrics dashboards', 'Cost allocation models'], escalation_path: 'Operations → CEO se data indisponivel para financial close' },
  ],
  escalation_path: 'Operations Head → CEO (via escalation message)',
  tools: ['Budget Tracking Spreadsheet', 'Compliance Checklist Engine', 'Infrastructure Cost Monitor', 'Process Automation Platform', 'Vendor Management System'],
  autonomy_level: 'medium',
};

// ─── Interaction Matrix (all cross-department interactions) ───────────────────

const interactionMatrix: DepartmentInteraction[] = [
  ...productDepartment.interactions,
  ...engineeringDepartment.interactions,
  ...growthDepartment.interactions,
  ...salesDepartment.interactions,
  ...dataDepartment.interactions,
  ...operationsDepartment.interactions,
];

// ─── Organization Assembly ───────────────────────────────────────────────────

export const organization: Organization = {
  name: 'One Agent Corp',
  mission: 'Construir e escalar micro-SaaS de alto crescimento operando como empresa virtual 100% remote, comandada por CEO via mensagens estruturadas.',
  vision: 'Ser a fabrica de micro-SaaS mais eficiente do mundo — cada produto de ideia a escala em semanas, nao meses.',
  model: 'Virtual Enterprise — Remote-First, Message-Driven, Hypergrowth',
  departments: {
    product: productDepartment,
    engineering: engineeringDepartment,
    growth: growthDepartment,
    sales: salesDepartment,
    data: dataDepartment,
    operations: operationsDepartment,
  },
  interaction_matrix: interactionMatrix,
  created_at: '2026-03-11T00:00:00Z',
  version: '1.0.0',
};

// ─── Helper Functions ────────────────────────────────────────────────────────

export function getDepartment(id: DepartmentId): Department | undefined {
  return organization.departments[id];
}

export function getInteractions(id: DepartmentId): DepartmentInteraction[] {
  return interactionMatrix.filter(
    (interaction) => interaction.from === id || interaction.to === id
  );
}

export function getKPIs(id: DepartmentId): KPI[] {
  const dept = organization.departments[id];
  return dept ? dept.kpis : [];
}

export function validateKPI(kpi: KPI, currentValue: number): boolean {
  // For 'count' targets where 0 is the target (e.g., compliance incidents),
  // success means currentValue <= target.
  // For most KPIs, success means currentValue >= target.
  if (kpi.unit === 'days') {
    // Lower is better for time-based KPIs
    return currentValue <= kpi.target;
  }
  if (kpi.id === 'ops_compliance_incidents') {
    return currentValue <= kpi.target;
  }
  if (kpi.id === 'ops_burn_rate_accuracy') {
    // Burn rate: closer to target (90%) is better, over is bad
    return currentValue <= kpi.target;
  }
  return currentValue >= kpi.target;
}

export function getAllDepartmentIds(): DepartmentId[] {
  return Object.keys(organization.departments) as DepartmentId[];
}

export function getInteractionsBetween(
  from: DepartmentId,
  to: DepartmentId
): DepartmentInteraction[] {
  return interactionMatrix.filter(
    (i) => i.from === from && i.to === to
  );
}

// ─── Organization Config (single export for consumers) ───────────────────────

export const organizationConfig: OrganizationConfig = {
  organization,
  getDepartment,
  getInteractions,
  getKPIs,
  validateKPI,
};
