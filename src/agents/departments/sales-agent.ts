// One Agent Corp — SalesAgent
// Domain D-4: Sales department agent — pipeline, conversions, outreach, upsell
// Relevant directives: qualify-lead, close-deal, run-demo, upsell-account,
//                      outreach-campaign, update-pipeline, execute_product_launch

import { MessageRouter } from '../../messaging/router';
import type { DirectiveMessage } from '../../messaging/types';
import { BaseDepartment, Task, TaskResult, Report } from './base-department';

// ─── Sales-specific action verbs ──────────────────────────────────────────────

const SALES_ACTIONS = new Set([
  'qualify-lead',
  'close-deal',
  'run-demo',
  'upsell-account',
  'outreach-campaign',
  'update-pipeline',
  'execute_product_launch', // sales component of a launch
  'negotiate-contract',
  'handle-objection',
  'request-referral',
  'churn-save',
]);

// ─── Sales Pipeline Stage ──────────────────────────────────────────────────────

interface PipelineDeal {
  id: string;
  company: string;
  stage: 'mql' | 'sql' | 'demo' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
  arpu_potential: number;
  days_in_stage: number;
}

// ─── SalesAgent ────────────────────────────────────────────────────────────────

export class SalesAgent extends BaseDepartment {
  /** Revenue growth QoQ (%) */
  private revenueGrowthQoq = 6.5;
  /** Win rate (%) */
  private winRate = 18;
  /** Average revenue per user (USD) */
  private arpu = 62;
  /** Average sales cycle length (days) */
  private avgSalesCycleDays = 20;
  /** Expansion revenue rate (%) */
  private expansionRevenueRate = 12;
  /** Active pipeline */
  private pipeline: PipelineDeal[] = [
    { id: 'deal-001', company: 'Acme Corp', stage: 'demo', arpu_potential: 99, days_in_stage: 3 },
    { id: 'deal-002', company: 'Beta Inc', stage: 'proposal', arpu_potential: 149, days_in_stage: 7 },
    { id: 'deal-003', company: 'Gamma LLC', stage: 'sql', arpu_potential: 49, days_in_stage: 2 },
  ];

  constructor(router: MessageRouter) {
    super('sales', router);
    this.metrics['sales_revenue_growth'] = this.revenueGrowthQoq;
    this.metrics['sales_win_rate'] = this.winRate;
    this.metrics['sales_arpu'] = this.arpu;
    this.metrics['sales_cycle_length'] = this.avgSalesCycleDays;
    this.metrics['sales_expansion_revenue'] = this.expansionRevenueRate;
  }

  // ── Directive Relevance ───────────────────────────────────────────────────

  protected isRelevantDirective(directive: DirectiveMessage): boolean {
    return SALES_ACTIONS.has(directive.payload.action);
  }

  // ── Task Execution ────────────────────────────────────────────────────────

  executeTask(task: Task): TaskResult {
    const now = new Date().toISOString();
    const ctx = (task.payload.context ?? {}) as Record<string, unknown>;

    switch (task.type) {
      case 'qualify-lead': {
        const company = String(ctx.company ?? `company-${Date.now()}`);
        const arpuPotential = Number(ctx.arpu_potential ?? 79);
        const qualified = arpuPotential > 30 && Math.random() > 0.25;

        if (qualified) {
          this.pipeline.push({
            id: `deal-${this.pipeline.length + 1}`,
            company,
            stage: 'sql',
            arpu_potential: arpuPotential,
            days_in_stage: 0,
          });
        }

        return {
          task_id: task.id,
          status: 'success',
          completed_at: now,
          output: {
            action: 'lead_qualified',
            company,
            result: qualified ? 'sql' : 'disqualified',
            arpu_potential: arpuPotential,
            pipeline_size: this.pipeline.length,
          },
          notes: `Lead '${company}' ${qualified ? 'qualified as SQL' : 'disqualified'}. Pipeline: ${this.pipeline.length} deals.`,
        };
      }

      case 'run-demo': {
        const deal = this.findDealByStage('sql') ?? this.pipeline[0];
        if (!deal) {
          return {
            task_id: task.id,
            status: 'blocked',
            completed_at: now,
            output: { action: 'demo_blocked', reason: 'no_qualified_deals' },
            notes: 'No qualified deals available for demo.',
          };
        }
        deal.stage = 'demo';
        deal.days_in_stage = 0;
        return {
          task_id: task.id,
          status: 'success',
          completed_at: now,
          output: {
            action: 'demo_completed',
            company: deal.company,
            stage: 'demo',
            sentiment: 'positive',
            next_step: 'proposal',
          },
          notes: `Demo completed for ${deal.company}. Positive sentiment. Moving to proposal.`,
        };
      }

      case 'close-deal': {
        const deal = this.findDealByStage('negotiation') ?? this.findDealByStage('proposal');
        if (!deal) {
          return {
            task_id: task.id,
            status: 'blocked',
            completed_at: now,
            output: { action: 'close_blocked', reason: 'no_deals_ready' },
            notes: 'No deals in negotiation/proposal stage to close.',
          };
        }

        const won = Math.random() > 0.4; // 60% close rate for late-stage
        deal.stage = won ? 'closed-won' : 'closed-lost';

        if (won) {
          this.winRate = Math.min(50, this.winRate + 2);
          this.arpu = Math.max(30, (this.arpu + deal.arpu_potential) / 2);
          this.revenueGrowthQoq = Math.min(30, this.revenueGrowthQoq + 1.5);
          this.metrics['sales_win_rate'] = this.winRate;
          this.metrics['sales_arpu'] = this.arpu;
          this.metrics['sales_revenue_growth'] = this.revenueGrowthQoq;
        }

        this.pipeline = this.pipeline.filter((d) => d.id !== deal.id);

        return {
          task_id: task.id,
          status: 'success',
          completed_at: now,
          output: {
            action: 'deal_closed',
            company: deal.company,
            result: won ? 'won' : 'lost',
            arpu: won ? deal.arpu_potential : 0,
            win_rate: this.winRate,
            pipeline_remaining: this.pipeline.length,
          },
          notes: `Deal with ${deal.company} ${won ? 'WON' : 'LOST'}. Win rate: ${this.winRate}%.`,
        };
      }

      case 'upsell-account': {
        const company = String(ctx.company ?? 'existing-customer');
        const upsellAmount = Number(ctx.amount ?? 20);

        this.arpu = Math.min(200, this.arpu + upsellAmount);
        this.expansionRevenueRate = Math.min(40, this.expansionRevenueRate + 2);
        this.metrics['sales_arpu'] = this.arpu;
        this.metrics['sales_expansion_revenue'] = this.expansionRevenueRate;

        return {
          task_id: task.id,
          status: 'success',
          completed_at: now,
          output: {
            action: 'account_upsold',
            company,
            arpu_increase: upsellAmount,
            new_arpu: this.arpu,
            expansion_revenue_rate: this.expansionRevenueRate,
          },
          notes: `${company} upsold +$${upsellAmount}/mo. New ARPU: $${this.arpu.toFixed(0)}.`,
        };
      }

      case 'outreach-campaign':
      case 'execute_product_launch': {
        const newLeads = Math.floor(Math.random() * 20 + 10);
        for (let i = 0; i < 3; i++) {
          this.pipeline.push({
            id: `deal-auto-${Date.now()}-${i}`,
            company: `Prospect-${Date.now()}-${i}`,
            stage: 'mql',
            arpu_potential: Math.floor(Math.random() * 80 + 30),
            days_in_stage: 0,
          });
        }
        return {
          task_id: task.id,
          status: 'success',
          completed_at: now,
          output: {
            action: 'outreach_complete',
            contacts_reached: newLeads,
            mqls_generated: 3,
            pipeline_size: this.pipeline.length,
          },
          notes: `Outreach campaign complete. ${newLeads} contacts reached, 3 MQLs added to pipeline.`,
        };
      }

      case 'churn-save': {
        const company = String(ctx.company ?? 'at-risk-customer');
        const saved = Math.random() > 0.35;
        if (saved) {
          this.revenueGrowthQoq = Math.min(30, this.revenueGrowthQoq + 0.5);
          this.metrics['sales_revenue_growth'] = this.revenueGrowthQoq;
        }
        return {
          task_id: task.id,
          status: 'success',
          completed_at: now,
          output: {
            action: 'churn_save_attempt',
            company,
            result: saved ? 'retained' : 'churned',
            retention_offer: saved ? '1 month free + dedicated support' : 'none accepted',
          },
          notes: `Churn save for ${company}: ${saved ? 'RETAINED' : 'CHURNED'}.`,
        };
      }

      case 'update-pipeline':
      case 'negotiate-contract':
      case 'handle-objection':
      case 'request-referral':
      default: {
        return {
          task_id: task.id,
          status: 'success',
          completed_at: now,
          output: { action: task.type, completed: true },
          notes: `Sales task '${task.type}' completed.`,
        };
      }
    }
  }

  // ── Report Generation ─────────────────────────────────────────────────────

  sendReport(): Report {
    const period = this.currentPeriod();
    const kpiStatus = this.buildKpiStatus();

    const failingKpis = Object.entries(kpiStatus)
      .filter(([, v]) => !v.passing)
      .map(([id]) => id);

    if (failingKpis.length > 0) {
      this.escalate(
        `Sales KPI breach: ${failingKpis.join(', ')} — below targets in ${period}`
      );
    }

    const activePipeline = this.pipeline.filter(
      (d) => d.stage !== 'closed-won' && d.stage !== 'closed-lost'
    );

    const report: Report = {
      department_id: 'sales',
      period,
      summary:
        `Sales: Revenue growth ${this.revenueGrowthQoq.toFixed(1)}% QoQ, win rate ${this.winRate}%, ` +
        `ARPU $${this.arpu.toFixed(0)}, sales cycle ${this.avgSalesCycleDays}d, ` +
        `pipeline ${activePipeline.length} active deals.`,
      metrics: { ...this.metrics },
      kpi_status: kpiStatus,
      blockers: [...this.blockers],
      next_actions: [
        'Follow up on 3 deals in demo stage',
        'Run upsell campaign on accounts > 6 months tenure',
        'Request customer referrals from 10 net-promoter customers',
      ],
      generated_at: new Date().toISOString(),
    };

    this.routeReport(
      {
        period,
        summary: report.summary,
        metrics: report.metrics,
        blockers: report.blockers,
        next_actions: report.next_actions,
      },
      `Sales Report — ${period}`
    );

    return report;
  }

  // ── Escalation ────────────────────────────────────────────────────────────

  escalate(reason: string): void {
    const isRevenueAtRisk = this.revenueGrowthQoq < 5;
    const isWinRateCritical = this.winRate < 10;

    this.routeEscalation(
      {
        severity: isRevenueAtRisk || isWinRateCritical ? 'high' : 'medium',
        incident: `Sales escalation: ${reason.substring(0, 80)}`,
        description: reason,
        impact: isWinRateCritical
          ? `Win rate at ${this.winRate}% — pipeline conversion failing. Revenue targets unreachable.`
          : `Revenue growth at ${this.revenueGrowthQoq.toFixed(1)}% QoQ — below 10% target.`,
        proposed_resolution:
          'CEO review of ICP alignment, pricing, and sales enablement resources.',
        blocker_since: new Date().toISOString(),
        affected_kpis: ['sales_revenue_growth', 'sales_win_rate', 'sales_arpu'],
      },
      `[ESCALATION] Sales — ${reason.substring(0, 60)}`
    );
  }

  // ── Domain-specific Methods ───────────────────────────────────────────────

  getPipelineDeals(): readonly PipelineDeal[] { return [...this.pipeline]; }
  getWinRate(): number { return this.winRate; }
  getArpu(): number { return this.arpu; }

  private findDealByStage(stage: PipelineDeal['stage']): PipelineDeal | undefined {
    return this.pipeline.find((d) => d.stage === stage);
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createSalesAgent(router: MessageRouter): SalesAgent {
  return new SalesAgent(router);
}

export function generateReport(agent: SalesAgent): Report {
  return agent.sendReport();
}
