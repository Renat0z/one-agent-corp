// One Agent Corp — EngineeringAgent
// Domain D-4: Engineering department agent — MVPs, stack, code reviews, deploys
// Relevant directives: deploy, build-mvp, code-review, fix-bug, setup-infra,
//                      run-ci, refactor, update-dependencies, resolve-incident

import { MessageRouter } from '../../messaging/router';
import type { DirectiveMessage } from '../../messaging/types';
import { BaseDepartment, Task, TaskResult, Report } from './base-department';

// ─── Engineering-specific action verbs ───────────────────────────────────────

const ENGINEERING_ACTIONS = new Set([
  'deploy',
  'build-mvp',
  'code-review',
  'fix-bug',
  'setup-infra',
  'run-ci',
  'refactor',
  'update-dependencies',
  'resolve-incident',
  'implement-feature',
  'write-tests',
  'setup-monitoring',
]);

// ─── EngineeringAgent ─────────────────────────────────────────────────────────

export class EngineeringAgent extends BaseDepartment {
  /** Deploys in the current measurement period */
  private deploysThisPeriod = 0;
  /** Simulated service uptime percentage */
  private uptimePercent = 99.7;
  /** Lead time from commit to prod (hours) */
  private leadTimeHours = 18;
  /** Bug escape rate (% bugs found in prod) */
  private bugEscapeRate = 8;
  /** Test coverage percentage */
  private testCoverage = 75;
  /** Whether an active incident is in-progress */
  private activeIncident: string | null = null;

  constructor(router: MessageRouter) {
    super('engineering', router);
    this.metrics['eng_deploy_frequency'] = this.deploysThisPeriod;
    this.metrics['eng_uptime'] = this.uptimePercent;
    this.metrics['eng_lead_time'] = this.leadTimeHours;
    this.metrics['eng_bug_escape_rate'] = this.bugEscapeRate;
    this.metrics['eng_test_coverage'] = this.testCoverage;
  }

  // ── Directive Relevance ───────────────────────────────────────────────────

  protected isRelevantDirective(directive: DirectiveMessage): boolean {
    return ENGINEERING_ACTIONS.has(directive.payload.action);
  }

  // ── Task Execution ────────────────────────────────────────────────────────

  executeTask(task: Task): TaskResult {
    const now = new Date().toISOString();
    const ctx = (task.payload.context ?? {}) as Record<string, unknown>;

    switch (task.type) {
      case 'deploy': {
        this.deploysThisPeriod += 1;
        this.leadTimeHours = Math.max(4, this.leadTimeHours - 1); // improving
        this.metrics['eng_deploy_frequency'] = this.deploysThisPeriod;
        this.metrics['eng_lead_time'] = this.leadTimeHours;
        return {
          task_id: task.id,
          status: 'success',
          completed_at: now,
          output: {
            action: 'deployed',
            deploy_number: this.deploysThisPeriod,
            environment: 'production',
            lead_time_hours: this.leadTimeHours,
            rollback_available: true,
          },
          notes: `Deploy #${this.deploysThisPeriod} completed. Lead time: ${this.leadTimeHours}h.`,
        };
      }

      case 'build-mvp': {
        const mvpName = String(ctx.product ?? 'mvp-product');
        this.testCoverage = Math.min(90, this.testCoverage + 3);
        this.metrics['eng_test_coverage'] = this.testCoverage;
        return {
          task_id: task.id,
          status: 'success',
          completed_at: now,
          output: {
            action: 'mvp_built',
            product: mvpName,
            stack: ['TypeScript', 'Node.js', 'PostgreSQL', 'Redis'],
            features_implemented: 5,
            test_coverage: this.testCoverage,
            ready_for_qa: true,
          },
          notes: `MVP for ${mvpName} built. Stack: TS/Node/PG. Coverage at ${this.testCoverage}%.`,
        };
      }

      case 'code-review': {
        const prCount = Number(ctx.prs ?? 1);
        const bugsFound = Math.floor(prCount * 0.3);
        this.bugEscapeRate = Math.max(3, this.bugEscapeRate - 0.5);
        this.metrics['eng_bug_escape_rate'] = this.bugEscapeRate;
        return {
          task_id: task.id,
          status: 'success',
          completed_at: now,
          output: {
            action: 'code_review_complete',
            prs_reviewed: prCount,
            bugs_found: bugsFound,
            approved: prCount - bugsFound,
            changes_requested: bugsFound,
            bug_escape_rate: this.bugEscapeRate,
          },
          notes: `${prCount} PRs reviewed. ${bugsFound} sent back with changes requested.`,
        };
      }

      case 'fix-bug': {
        const severity = String(ctx.severity ?? 'medium');
        const fixTime = severity === 'critical' ? 2 : severity === 'high' ? 8 : 24;
        if (severity === 'critical' && this.activeIncident) {
          this.activeIncident = null;
          this.uptimePercent = Math.min(99.9, this.uptimePercent + 0.2);
          this.metrics['eng_uptime'] = this.uptimePercent;
        }
        return {
          task_id: task.id,
          status: 'success',
          completed_at: now,
          output: {
            action: 'bug_fixed',
            severity,
            fix_time_hours: fixTime,
            deployed_hotfix: severity === 'critical',
            uptime_restored: this.uptimePercent,
          },
          notes: `${severity} bug fixed in ${fixTime}h. Hotfix deployed: ${severity === 'critical'}.`,
        };
      }

      case 'setup-infra': {
        return {
          task_id: task.id,
          status: 'success',
          completed_at: now,
          output: {
            action: 'infra_setup',
            services: ['API Server', 'Database', 'Cache', 'CDN', 'Monitoring'],
            environment: 'production',
            iac_provider: 'Terraform',
            cost_per_user_usd: 1.8,
          },
          notes: 'Infrastructure provisioned via IaC. Cost: $1.80/user/month.',
        };
      }

      case 'run-ci': {
        const passed = this.testCoverage >= 70;
        return {
          task_id: task.id,
          status: passed ? 'success' : 'failure',
          completed_at: now,
          output: {
            action: 'ci_run',
            tests_passed: passed,
            coverage: this.testCoverage,
            lint_passed: true,
            build_time_seconds: 45,
          },
          notes: passed
            ? `CI passed. Coverage: ${this.testCoverage}%.`
            : `CI failed. Coverage below threshold: ${this.testCoverage}% < 70%.`,
        };
      }

      case 'resolve-incident': {
        const incident = String(ctx.incident ?? 'service-outage');
        this.activeIncident = null;
        this.uptimePercent = Math.min(99.9, this.uptimePercent + 0.3);
        this.metrics['eng_uptime'] = this.uptimePercent;
        return {
          task_id: task.id,
          status: 'success',
          completed_at: now,
          output: {
            action: 'incident_resolved',
            incident,
            mttr_minutes: 25,
            root_cause: 'Memory leak in caching layer',
            postmortem_scheduled: true,
            uptime: this.uptimePercent,
          },
          notes: `Incident '${incident}' resolved in 25min. Postmortem scheduled.`,
        };
      }

      case 'implement-feature': {
        this.deploysThisPeriod += 1;
        this.metrics['eng_deploy_frequency'] = this.deploysThisPeriod;
        return {
          task_id: task.id,
          status: 'success',
          completed_at: now,
          output: {
            action: 'feature_implemented',
            feature: String(ctx.feature ?? 'new-feature'),
            story_points: 8,
            deployed: true,
            deploy_count: this.deploysThisPeriod,
          },
          notes: 'Feature implemented, tested, and deployed to production.',
        };
      }

      case 'write-tests': {
        this.testCoverage = Math.min(95, this.testCoverage + 8);
        this.metrics['eng_test_coverage'] = this.testCoverage;
        return {
          task_id: task.id,
          status: 'success',
          completed_at: now,
          output: {
            action: 'tests_written',
            unit_tests: 24,
            integration_tests: 6,
            e2e_tests: 3,
            coverage: this.testCoverage,
          },
          notes: `Tests written. Coverage improved to ${this.testCoverage}%.`,
        };
      }

      case 'refactor':
      case 'update-dependencies':
      case 'setup-monitoring':
      default: {
        return {
          task_id: task.id,
          status: 'success',
          completed_at: now,
          output: { action: task.type, completed: true },
          notes: `Engineering task '${task.type}' completed successfully.`,
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
        `Engineering KPI breach: ${failingKpis.join(', ')} below targets in ${period}`
      );
    }

    if (this.activeIncident) {
      this.escalate(`Active production incident: ${this.activeIncident}`);
    }

    const report: Report = {
      department_id: 'engineering',
      period,
      summary:
        `Engineering: ${this.deploysThisPeriod} deploys, uptime ${this.uptimePercent}%, ` +
        `lead time ${this.leadTimeHours}h, test coverage ${this.testCoverage}%, ` +
        `bug escape rate ${this.bugEscapeRate}%.` +
        (this.activeIncident ? ` ACTIVE INCIDENT: ${this.activeIncident}` : ''),
      metrics: { ...this.metrics },
      kpi_status: kpiStatus,
      blockers: [...this.blockers],
      next_actions: [
        'Increase test coverage to 80%+',
        'Reduce lead time to sub-16h target',
        'Complete dependency upgrades for security patches',
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
      `Engineering Report — ${period}`
    );

    return report;
  }

  // ── Escalation ────────────────────────────────────────────────────────────

  escalate(reason: string): void {
    const isCritical =
      reason.toLowerCase().includes('incident') ||
      reason.toLowerCase().includes('outage') ||
      this.uptimePercent < 99.0;

    this.routeEscalation(
      {
        severity: isCritical ? 'critical' : 'high',
        incident: `Engineering escalation: ${reason.substring(0, 80)}`,
        description: reason,
        impact: isCritical
          ? 'Production service degraded — direct revenue and retention impact.'
          : 'Engineering velocity and quality metrics below targets.',
        proposed_resolution: isCritical
          ? 'Immediate incident response and hotfix deployment.'
          : 'CEO review of engineering capacity and prioritization.',
        blocker_since: new Date().toISOString(),
        affected_kpis: ['eng_uptime', 'eng_deploy_frequency', 'eng_lead_time'],
      },
      `[ESCALATION] Engineering — ${reason.substring(0, 60)}`
    );
  }

  // ── Domain-specific Methods ───────────────────────────────────────────────

  /** Trigger an active incident (sets state for next report cycle) */
  triggerIncident(description: string): void {
    this.activeIncident = description;
    this.uptimePercent = Math.max(95, this.uptimePercent - 1.5);
    this.metrics['eng_uptime'] = this.uptimePercent;
    this.escalate(`Production incident triggered: ${description}`);
  }

  getUptimePercent(): number { return this.uptimePercent; }
  getDeployCount(): number { return this.deploysThisPeriod; }
  getTestCoverage(): number { return this.testCoverage; }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createEngineeringAgent(router: MessageRouter): EngineeringAgent {
  return new EngineeringAgent(router);
}

export function generateReport(agent: EngineeringAgent): Report {
  return agent.sendReport();
}
