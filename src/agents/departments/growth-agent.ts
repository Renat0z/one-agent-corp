// One Agent Corp — GrowthAgent
// Domain D-4: Growth department agent — growth hacking, A/B tests, acquisition metrics
// Relevant directives: launch-campaign, run-ab-test, optimize-funnel, scale-channel,
//                      create-content, setup-referral, analyze-cohort, set-growth-target

import { MessageRouter } from '../../messaging/router';
import type { DirectiveMessage } from '../../messaging/types';
import { BaseDepartment, Task, TaskResult, Report } from './base-department';

// ─── Growth-specific action verbs ─────────────────────────────────────────────

const GROWTH_ACTIONS = new Set([
  'launch-campaign',
  'run-ab-test',
  'optimize-funnel',
  'scale-channel',
  'create-content',
  'setup-referral',
  'analyze-cohort',
  'set-growth-target',
  'execute_product_launch', // from MessageTemplates.launchDirective
  'growth-hack',
  'onboarding-optimize',
]);

// ─── GrowthAgent ──────────────────────────────────────────────────────────────

export class GrowthAgent extends BaseDepartment {
  /** MRR growth rate % month-over-month */
  private mrrGrowthRate = 8.5;
  /** Customer Acquisition Cost in USD */
  private cac = 62;
  /** Experiments completed this month */
  private experimentsRun = 4;
  /** User activation rate % */
  private activationRate = 48;
  /** Viral coefficient */
  private viralCoefficient = 0.8;
  /** Active experiments */
  private activeExperiments: string[] = [];

  constructor(router: MessageRouter) {
    super('growth', router);
    this.metrics['growth_mrr_growth'] = this.mrrGrowthRate;
    this.metrics['growth_cac'] = this.cac;
    this.metrics['growth_experiments'] = this.experimentsRun;
    this.metrics['growth_activation_rate'] = this.activationRate;
    this.metrics['growth_viral_coefficient'] = this.viralCoefficient;
  }

  // ── Directive Relevance ───────────────────────────────────────────────────

  protected isRelevantDirective(directive: DirectiveMessage): boolean {
    return GROWTH_ACTIONS.has(directive.payload.action);
  }

  // ── Task Execution ────────────────────────────────────────────────────────

  executeTask(task: Task): TaskResult {
    const now = new Date().toISOString();
    const ctx = (task.payload.context ?? {}) as Record<string, unknown>;

    switch (task.type) {
      case 'launch-campaign':
      case 'execute_product_launch': {
        const productName = String(
          ctx.product ?? ctx.productName ?? 'product'
        );
        const channels = (task.payload.resources as string[]) ?? ['email', 'social', 'paid'];

        this.mrrGrowthRate = Math.min(30, this.mrrGrowthRate + 3.5);
        this.cac = Math.max(20, this.cac - 5);
        this.experimentsRun += 1;
        this.metrics['growth_mrr_growth'] = this.mrrGrowthRate;
        this.metrics['growth_cac'] = this.cac;
        this.metrics['growth_experiments'] = this.experimentsRun;

        return {
          task_id: task.id,
          status: 'success',
          completed_at: now,
          output: {
            action: 'campaign_launched',
            product: productName,
            channels,
            expected_mqls: 200,
            expected_trial_signups: 100,
            campaign_budget_usd: 3000,
            projected_cac: this.cac,
          },
          notes: `Campaign launched for ${productName} across ${channels.join(', ')}.`,
        };
      }

      case 'run-ab-test': {
        const testName = String(ctx.test ?? `ab-test-${this.experimentsRun + 1}`);
        this.experimentsRun += 1;
        this.activeExperiments.push(testName);
        this.metrics['growth_experiments'] = this.experimentsRun;

        const winner = Math.random() > 0.4 ? 'variant-B' : 'control';
        const lift = winner === 'variant-B' ? +(Math.random() * 15 + 5).toFixed(1) : 0;

        if (winner === 'variant-B') {
          this.activationRate = Math.min(95, this.activationRate + lift * 0.3);
          this.metrics['growth_activation_rate'] = this.activationRate;
        }

        this.activeExperiments = this.activeExperiments.filter((e) => e !== testName);

        return {
          task_id: task.id,
          status: 'success',
          completed_at: now,
          output: {
            action: 'ab_test_complete',
            test: testName,
            winner,
            lift_percent: lift,
            statistical_significance: 0.95,
            sample_size: 1200,
            activation_rate: this.activationRate,
          },
          notes: `A/B test '${testName}' complete. Winner: ${winner}, lift: ${lift}%.`,
        };
      }

      case 'optimize-funnel': {
        const stageName = String(ctx.stage ?? 'onboarding');
        const improvement = +(Math.random() * 12 + 3).toFixed(1);
        this.activationRate = Math.min(95, this.activationRate + improvement * 0.2);
        this.metrics['growth_activation_rate'] = this.activationRate;
        return {
          task_id: task.id,
          status: 'success',
          completed_at: now,
          output: {
            action: 'funnel_optimized',
            stage: stageName,
            improvement_percent: improvement,
            activation_rate: this.activationRate,
            drop_off_points_fixed: 2,
          },
          notes: `Funnel stage '${stageName}' optimized. Activation rate: ${this.activationRate.toFixed(1)}%.`,
        };
      }

      case 'scale-channel': {
        const channel = String(ctx.channel ?? 'paid-search');
        const multiplier = 2;
        this.mrrGrowthRate = Math.min(30, this.mrrGrowthRate + 2);
        this.cac = Math.min(120, this.cac + 8); // scaling increases CAC initially
        this.metrics['growth_mrr_growth'] = this.mrrGrowthRate;
        this.metrics['growth_cac'] = this.cac;
        return {
          task_id: task.id,
          status: 'success',
          completed_at: now,
          output: {
            action: 'channel_scaled',
            channel,
            budget_multiplier: multiplier,
            expected_volume_increase: '2x',
            new_cac_estimate: this.cac,
            mrr_growth_rate: this.mrrGrowthRate,
          },
          notes: `Channel '${channel}' scaled ${multiplier}x. CAC monitored.`,
        };
      }

      case 'setup-referral': {
        this.viralCoefficient = Math.min(2.0, this.viralCoefficient + 0.2);
        this.metrics['growth_viral_coefficient'] = this.viralCoefficient;
        return {
          task_id: task.id,
          status: 'success',
          completed_at: now,
          output: {
            action: 'referral_setup',
            program_type: 'double-sided',
            referrer_reward: '$10 credit',
            referee_reward: '30-day free trial',
            viral_coefficient: this.viralCoefficient,
          },
          notes: `Referral program live. Viral coefficient: ${this.viralCoefficient.toFixed(2)}.`,
        };
      }

      case 'onboarding-optimize': {
        this.activationRate = Math.min(95, this.activationRate + 7);
        this.metrics['growth_activation_rate'] = this.activationRate;
        return {
          task_id: task.id,
          status: 'success',
          completed_at: now,
          output: {
            action: 'onboarding_optimized',
            steps_removed: 3,
            time_to_aha_minutes: 5,
            activation_rate: this.activationRate,
          },
          notes: `Onboarding streamlined. Activation rate improved to ${this.activationRate.toFixed(1)}%.`,
        };
      }

      case 'create-content':
      case 'analyze-cohort':
      case 'set-growth-target':
      case 'growth-hack':
      default: {
        return {
          task_id: task.id,
          status: 'success',
          completed_at: now,
          output: { action: task.type, completed: true },
          notes: `Growth task '${task.type}' completed.`,
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
        `Growth KPI breach: ${failingKpis.join(', ')} — below targets in ${period}`
      );
    }

    const report: Report = {
      department_id: 'growth',
      period,
      summary:
        `Growth: MRR growth ${this.mrrGrowthRate.toFixed(1)}% MoM, CAC $${this.cac}, ` +
        `${this.experimentsRun} experiments run, activation ${this.activationRate.toFixed(1)}%, ` +
        `viral coefficient ${this.viralCoefficient.toFixed(2)}.`,
      metrics: { ...this.metrics },
      kpi_status: kpiStatus,
      blockers: [...this.blockers],
      next_actions: [
        'Scale top-performing A/B test variant to 100%',
        'Launch referral program for new product',
        'Run cohort analysis for 30-day churn drivers',
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
      `Growth Report — ${period}`
    );

    return report;
  }

  // ── Escalation ────────────────────────────────────────────────────────────

  escalate(reason: string): void {
    const isBudgetCrisis = this.cac > 100;
    const isGrowthStall = this.mrrGrowthRate < 5;

    this.routeEscalation(
      {
        severity: isBudgetCrisis || isGrowthStall ? 'high' : 'medium',
        incident: `Growth escalation: ${reason.substring(0, 80)}`,
        description: reason,
        impact: isBudgetCrisis
          ? `CAC at $${this.cac} threatens unit economics — LTV/CAC ratio degraded.`
          : `MRR growth at ${this.mrrGrowthRate.toFixed(1)}% — below 15% target. Hypergrowth at risk.`,
        proposed_resolution: 'CEO review of growth budget, channel mix, and experiment velocity.',
        blocker_since: new Date().toISOString(),
        affected_kpis: ['growth_mrr_growth', 'growth_cac', 'growth_activation_rate'],
      },
      `[ESCALATION] Growth — ${reason.substring(0, 60)}`
    );
  }

  // ── Domain-specific Methods ───────────────────────────────────────────────

  getCac(): number { return this.cac; }
  getMrrGrowthRate(): number { return this.mrrGrowthRate; }
  getViralCoefficient(): number { return this.viralCoefficient; }
  getActiveExperiments(): readonly string[] { return [...this.activeExperiments]; }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createGrowthAgent(router: MessageRouter): GrowthAgent {
  return new GrowthAgent(router);
}

export function generateReport(agent: GrowthAgent): Report {
  return agent.sendReport();
}
