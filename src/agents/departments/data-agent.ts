// One Agent Corp — DataAgent
// Domain D-4: Data & Analytics department agent — dashboards, insights, reports
// Relevant directives: generate-report, analyze-experiment, build-dashboard,
//                      model-churn, forecast-revenue, audit-data-quality, run-cohort-analysis

import { MessageRouter } from '../../messaging/router';
import type { DirectiveMessage } from '../../messaging/types';
import { BaseDepartment, Task, TaskResult, Report } from './base-department';

// ─── Data-specific action verbs ───────────────────────────────────────────────

const DATA_ACTIONS = new Set([
  'generate-report',
  'analyze-experiment',
  'build-dashboard',
  'model-churn',
  'forecast-revenue',
  'audit-data-quality',
  'run-cohort-analysis',
  'compute-ltv',
  'track-funnel',
  'export-metrics',
  'setup-tracking',
]);

// ─── Insight record ───────────────────────────────────────────────────────────

interface Insight {
  id: string;
  type: string;
  summary: string;
  confidence: number;
  generated_at: string;
  department_target?: string;
}

// ─── DataAgent ────────────────────────────────────────────────────────────────

export class DataAgent extends BaseDepartment {
  /** Average insight turnaround in hours */
  private insightTurnaroundHours = 36;
  /** Critical data freshness (hours since last update — lower is better) */
  private dataFreshnessHours = 0.8;
  /** Dashboard adoption rate (%) */
  private dashboardAdoptionRate = 83;
  /** Experiments analyzed on-time (%) */
  private experimentsAnalyzedOnTime = 78;
  /** Revenue prediction accuracy (%) */
  private predictionAccuracy = 81;
  /** Accumulated insights this period */
  private insightLog: Insight[] = [];
  /** Dashboards built */
  private dashboardsBuilt: string[] = ['growth-funnel', 'engineering-ops', 'sales-pipeline'];

  constructor(router: MessageRouter) {
    super('data', router);
    this.metrics['data_insight_turnaround'] = this.insightTurnaroundHours;
    this.metrics['data_freshness'] = this.dataFreshnessHours;
    this.metrics['data_dashboard_adoption'] = this.dashboardAdoptionRate;
    this.metrics['data_experiment_analysis'] = this.experimentsAnalyzedOnTime;
    this.metrics['data_prediction_accuracy'] = this.predictionAccuracy;
  }

  // ── Directive Relevance ───────────────────────────────────────────────────

  protected isRelevantDirective(directive: DirectiveMessage): boolean {
    return DATA_ACTIONS.has(directive.payload.action);
  }

  // ── Task Execution ────────────────────────────────────────────────────────

  executeTask(task: Task): TaskResult {
    const now = new Date().toISOString();
    const ctx = (task.payload.context ?? {}) as Record<string, unknown>;

    switch (task.type) {
      case 'generate-report': {
        const reportType = String(ctx.report_type ?? 'company-wide');
        this.insightTurnaroundHours = Math.max(4, this.insightTurnaroundHours - 2);
        this.metrics['data_insight_turnaround'] = this.insightTurnaroundHours;

        const insight: Insight = {
          id: `insight-${Date.now()}`,
          type: reportType,
          summary: `${reportType} report: key metrics compiled and trends identified.`,
          confidence: 0.9,
          generated_at: now,
          department_target: String(ctx.target ?? 'ceo'),
        };
        this.insightLog.push(insight);

        return {
          task_id: task.id,
          status: 'success',
          completed_at: now,
          output: {
            action: 'report_generated',
            report_type: reportType,
            sections: ['Executive Summary', 'KPI Dashboard', 'Trend Analysis', 'Recommendations'],
            insight_id: insight.id,
            turnaround_hours: this.insightTurnaroundHours,
          },
          notes: `Report '${reportType}' generated in ${this.insightTurnaroundHours}h.`,
        };
      }

      case 'analyze-experiment': {
        const experimentName = String(ctx.experiment ?? 'unnamed-experiment');
        const sampleSize = Number(ctx.sample_size ?? 1000);
        const onTime = Math.random() > 0.2;

        if (onTime) {
          this.experimentsAnalyzedOnTime = Math.min(100, this.experimentsAnalyzedOnTime + 1);
          this.metrics['data_experiment_analysis'] = this.experimentsAnalyzedOnTime;
        }

        const pValue = +(Math.random() * 0.1).toFixed(4);
        const significant = pValue < 0.05;
        const liftPercent = +(Math.random() * 20 - 5).toFixed(2);

        const insight: Insight = {
          id: `insight-${Date.now()}`,
          type: 'experiment-analysis',
          summary: `${experimentName}: ${significant ? 'Significant' : 'Not significant'} result. Lift: ${liftPercent}%`,
          confidence: 1 - pValue,
          generated_at: now,
          department_target: 'growth',
        };
        this.insightLog.push(insight);

        return {
          task_id: task.id,
          status: 'success',
          completed_at: now,
          output: {
            action: 'experiment_analyzed',
            experiment: experimentName,
            sample_size: sampleSize,
            p_value: pValue,
            statistically_significant: significant,
            lift_percent: liftPercent,
            recommendation: significant && liftPercent > 0 ? 'ship' : significant && liftPercent <= 0 ? 'revert' : 'extend-test',
            insight_id: insight.id,
          },
          notes: `Experiment '${experimentName}': p=${pValue}, lift=${liftPercent}%, ${significant ? 'significant' : 'not significant'}.`,
        };
      }

      case 'build-dashboard': {
        const dashboardName = String(ctx.dashboard ?? `dashboard-${Date.now()}`);
        this.dashboardsBuilt.push(dashboardName);
        this.dashboardAdoptionRate = Math.min(100,
          (this.dashboardsBuilt.length / 6) * 100
        );
        this.metrics['data_dashboard_adoption'] = this.dashboardAdoptionRate;

        return {
          task_id: task.id,
          status: 'success',
          completed_at: now,
          output: {
            action: 'dashboard_built',
            dashboard: dashboardName,
            panels: 8,
            refresh_interval_minutes: 15,
            departments_served: ['ceo', 'growth', 'sales'],
            adoption_rate: this.dashboardAdoptionRate,
          },
          notes: `Dashboard '${dashboardName}' built. Adoption rate: ${this.dashboardAdoptionRate.toFixed(0)}%.`,
        };
      }

      case 'model-churn': {
        const churnRate = +(Math.random() * 5 + 2).toFixed(2);
        const atRiskSegment = churnRate > 5 ? 'enterprise-12mo+' : 'smb-trial';
        this.predictionAccuracy = Math.min(95, this.predictionAccuracy + 1);
        this.metrics['data_prediction_accuracy'] = this.predictionAccuracy;

        const insight: Insight = {
          id: `insight-${Date.now()}`,
          type: 'churn-model',
          summary: `Churn model: ${churnRate}% monthly churn predicted. At-risk segment: ${atRiskSegment}`,
          confidence: this.predictionAccuracy / 100,
          generated_at: now,
          department_target: 'sales',
        };
        this.insightLog.push(insight);

        return {
          task_id: task.id,
          status: 'success',
          completed_at: now,
          output: {
            action: 'churn_modeled',
            predicted_churn_rate: churnRate,
            at_risk_segment: atRiskSegment,
            at_risk_accounts: Math.floor(churnRate * 10),
            model_accuracy: this.predictionAccuracy,
            insight_id: insight.id,
          },
          notes: `Churn model: ${churnRate}% predicted. ${Math.floor(churnRate * 10)} accounts at risk.`,
        };
      }

      case 'forecast-revenue': {
        const periodLabel = String(ctx.period ?? 'Q2-2026');
        const baseRevenue = Number(ctx.base_revenue ?? 50000);
        const growthAssumption = 0.12;
        const forecast = Math.floor(baseRevenue * (1 + growthAssumption));
        const confidenceInterval = Math.floor(forecast * 0.05);

        this.predictionAccuracy = Math.min(95, this.predictionAccuracy + 0.5);
        this.metrics['data_prediction_accuracy'] = this.predictionAccuracy;

        return {
          task_id: task.id,
          status: 'success',
          completed_at: now,
          output: {
            action: 'revenue_forecasted',
            period: periodLabel,
            forecast_usd: forecast,
            confidence_interval: `±$${confidenceInterval}`,
            growth_assumption: `${(growthAssumption * 100).toFixed(0)}%`,
            model_accuracy: this.predictionAccuracy,
          },
          notes: `Revenue forecast for ${periodLabel}: $${forecast.toLocaleString()} ±$${confidenceInterval}.`,
        };
      }

      case 'audit-data-quality': {
        const tablesAudited = 12;
        const issuesFound = Math.floor(Math.random() * 3);
        this.dataFreshnessHours = Math.max(0.1, this.dataFreshnessHours - 0.1);
        this.metrics['data_freshness'] = this.dataFreshnessHours;

        if (issuesFound > 0) {
          this.blockers.push(`Data quality issues found: ${issuesFound} tables with stale/incorrect data`);
        }

        return {
          task_id: task.id,
          status: issuesFound === 0 ? 'success' : 'success',
          completed_at: now,
          output: {
            action: 'data_quality_audited',
            tables_audited: tablesAudited,
            issues_found: issuesFound,
            data_freshness_hours: this.dataFreshnessHours,
            compliance_status: issuesFound === 0 ? 'compliant' : 'remediation-needed',
          },
          notes: `Data quality audit complete. ${tablesAudited} tables, ${issuesFound} issues found.`,
        };
      }

      case 'run-cohort-analysis': {
        const cohortPeriod = String(ctx.cohort ?? '2026-01');
        return {
          task_id: task.id,
          status: 'success',
          completed_at: now,
          output: {
            action: 'cohort_analysis_complete',
            cohort: cohortPeriod,
            retention_30d: 68,
            retention_60d: 52,
            retention_90d: 41,
            ltv_estimate_usd: 420,
            top_churn_reason: 'lack-of-engagement',
          },
          notes: `Cohort ${cohortPeriod}: 68%/52%/41% retention at 30/60/90 days. LTV: $420.`,
        };
      }

      case 'compute-ltv':
      case 'track-funnel':
      case 'export-metrics':
      case 'setup-tracking':
      default: {
        return {
          task_id: task.id,
          status: 'success',
          completed_at: now,
          output: { action: task.type, completed: true },
          notes: `Data task '${task.type}' completed.`,
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
        `Data KPI breach: ${failingKpis.join(', ')} — below targets in ${period}`
      );
    }

    const report: Report = {
      department_id: 'data',
      period,
      summary:
        `Data: ${this.insightLog.length} insights generated, turnaround ${this.insightTurnaroundHours}h, ` +
        `dashboard adoption ${this.dashboardAdoptionRate.toFixed(0)}%, ` +
        `prediction accuracy ${this.predictionAccuracy.toFixed(0)}%, ` +
        `data freshness ${this.dataFreshnessHours.toFixed(1)}h.`,
      metrics: { ...this.metrics },
      kpi_status: kpiStatus,
      blockers: [...this.blockers],
      next_actions: [
        'Deploy churn prediction alerts to Sales',
        'Increase dashboard adoption to 100% (Operations missing)',
        'Complete revenue forecast model for Q3',
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
      `Data Report — ${period}`
    );

    return report;
  }

  // ── Escalation ────────────────────────────────────────────────────────────

  escalate(reason: string): void {
    const isDataIncident =
      reason.toLowerCase().includes('stale') ||
      reason.toLowerCase().includes('quality') ||
      this.dataFreshnessHours > 2;

    this.routeEscalation(
      {
        severity: isDataIncident ? 'high' : 'medium',
        incident: `Data escalation: ${reason.substring(0, 80)}`,
        description: reason,
        impact: isDataIncident
          ? `Data freshness at ${this.dataFreshnessHours.toFixed(1)}h — decisions being made on stale data.`
          : `Analytics KPIs below targets — insight delivery SLA at risk.`,
        proposed_resolution:
          'CEO review of data infrastructure capacity and pipeline reliability.',
        blocker_since: new Date().toISOString(),
        affected_kpis: ['data_insight_turnaround', 'data_freshness', 'data_prediction_accuracy'],
      },
      `[ESCALATION] Data — ${reason.substring(0, 60)}`
    );
  }

  // ── Domain-specific Methods ───────────────────────────────────────────────

  getInsights(): readonly Insight[] { return [...this.insightLog]; }
  getDashboards(): readonly string[] { return [...this.dashboardsBuilt]; }
  getPredictionAccuracy(): number { return this.predictionAccuracy; }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createDataAgent(router: MessageRouter): DataAgent {
  return new DataAgent(router);
}

export function generateReport(agent: DataAgent): Report {
  return agent.sendReport();
}
