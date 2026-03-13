// One Agent Corp — ProductAgent
// Domain D-4: Product department agent — ideation, specs, feature prioritization
// Relevant directives: launch-project, define-roadmap, prioritize-features,
//                      conduct-discovery, validate-idea, update-spec

import { MessageRouter } from '../../messaging/router';
import type { DirectiveMessage } from '../../messaging/types';
import { BaseDepartment, Task, TaskResult, Report } from './base-department';

// ─── Product-specific action verbs ────────────────────────────────────────────

const PRODUCT_ACTIONS = new Set([
  'launch-project',
  'define-roadmap',
  'prioritize-features',
  'conduct-discovery',
  'validate-idea',
  'update-spec',
  'create-prd',
  'run-user-interviews',
  'score-ideas',
  'update-backlog',
]);

// ─── ProductAgent ──────────────────────────────────────────────────────────────

export class ProductAgent extends BaseDepartment {
  /** Running count of validated ideas this quarter */
  private ideasValidated = 0;
  /** Features shipped to backlog */
  private featuresInBacklog = 0;
  /** Running NPS mock (starts neutral) */
  private npsScore = 42;
  /** Days from idea to MVP for last completed project */
  private lastTimeToMvpDays = 35;
  /** Feature adoption rate (%) */
  private featureAdoptionRate = 32;

  constructor(router: MessageRouter) {
    super('product', router);
    // Seed product-specific initial metrics
    this.metrics['prod_time_to_mvp'] = this.lastTimeToMvpDays;
    this.metrics['prod_nps'] = this.npsScore;
    this.metrics['prod_ideas_validated'] = this.ideasValidated;
    this.metrics['prod_feature_adoption'] = this.featureAdoptionRate;
  }

  // ── Directive Relevance ───────────────────────────────────────────────────

  protected isRelevantDirective(directive: DirectiveMessage): boolean {
    return PRODUCT_ACTIONS.has(directive.payload.action);
  }

  // ── Task Execution ────────────────────────────────────────────────────────

  executeTask(task: Task): TaskResult {
    const now = new Date().toISOString();
    const ctx = (task.payload.context ?? {}) as Record<string, unknown>;

    switch (task.type) {
      case 'launch-project': {
        // Kick-off: create initial spec, add to backlog
        this.featuresInBacklog += 3; // initial set of features per new project
        this.lastTimeToMvpDays = 28; // target met on fresh launch
        this.metrics['prod_time_to_mvp'] = this.lastTimeToMvpDays;
        return {
          task_id: task.id,
          status: 'success',
          completed_at: now,
          output: {
            action: 'project_launched',
            initial_features: 3,
            backlog_size: this.featuresInBacklog,
            estimated_mvp_days: 28,
          },
          notes: `Project launch initiated. ${this.featuresInBacklog} features added to backlog.`,
        };
      }

      case 'define-roadmap': {
        this.ideasValidated += 2;
        this.metrics['prod_ideas_validated'] = this.ideasValidated;
        return {
          task_id: task.id,
          status: 'success',
          completed_at: now,
          output: {
            action: 'roadmap_defined',
            quarters_planned: 2,
            initiatives: ['MVP core', 'Onboarding flow', 'Analytics integration'],
            ideas_validated: this.ideasValidated,
          },
          notes: 'Q1-Q2 roadmap defined using RICE scoring framework.',
        };
      }

      case 'prioritize-features': {
        const riceScores: Record<string, number> = {
          'onboarding-v2': 240,
          'team-collaboration': 180,
          'api-integrations': 120,
          'advanced-reporting': 95,
        };
        return {
          task_id: task.id,
          status: 'success',
          completed_at: now,
          output: {
            action: 'features_prioritized',
            rice_scores: riceScores,
            top_priority: 'onboarding-v2',
          },
          notes: 'Features re-prioritized via RICE. Onboarding takes top slot.',
        };
      }

      case 'conduct-discovery': {
        this.ideasValidated += 1;
        this.npsScore = Math.min(80, this.npsScore + 2);
        this.metrics['prod_ideas_validated'] = this.ideasValidated;
        this.metrics['prod_nps'] = this.npsScore;
        return {
          task_id: task.id,
          status: 'success',
          completed_at: now,
          output: {
            action: 'discovery_complete',
            interviews_conducted: 5,
            pain_points_identified: 3,
            opportunities: ['Workflow automation', 'Integration hub', 'Reporting v2'],
            ideas_validated: this.ideasValidated,
          },
          notes: '5 user interviews. 3 validated pain points captured.',
        };
      }

      case 'validate-idea': {
        const ideaName = String(ctx.idea ?? 'unnamed-idea');
        const validated = Math.random() > 0.3; // 70% validation rate
        if (validated) {
          this.ideasValidated += 1;
          this.metrics['prod_ideas_validated'] = this.ideasValidated;
        }
        return {
          task_id: task.id,
          status: 'success',
          completed_at: now,
          output: {
            action: 'idea_validated',
            idea: ideaName,
            result: validated ? 'validated' : 'rejected',
            confidence: validated ? 0.75 : 0.25,
            ideas_validated_total: this.ideasValidated,
          },
          notes: `Idea '${ideaName}' ${validated ? 'validated' : 'rejected'} after smoke test.`,
        };
      }

      case 'update-spec':
      case 'create-prd': {
        return {
          task_id: task.id,
          status: 'success',
          completed_at: now,
          output: {
            action: task.type,
            spec_version: '1.0',
            sections: ['Overview', 'User Stories', 'Acceptance Criteria', 'Metrics'],
            ready_for_engineering: true,
          },
          notes: 'PRD created with full acceptance criteria and success metrics.',
        };
      }

      case 'run-user-interviews': {
        this.featureAdoptionRate = Math.min(90, this.featureAdoptionRate + 5);
        this.metrics['prod_feature_adoption'] = this.featureAdoptionRate;
        return {
          task_id: task.id,
          status: 'success',
          completed_at: now,
          output: {
            action: 'user_interviews_complete',
            participants: 8,
            insights: ['Users want faster onboarding', 'API integrations are blocking enterprise deals'],
            feature_adoption_rate: this.featureAdoptionRate,
          },
          notes: '8 participants. Key insight: onboarding friction is primary churn driver.',
        };
      }

      default: {
        return {
          task_id: task.id,
          status: 'failure',
          completed_at: now,
          output: { action: task.type },
          notes: `Unknown product task type: ${task.type}`,
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
        `KPI breach in Product: ${failingKpis.join(', ')} — below targets as of ${period}`
      );
    }

    const report: Report = {
      department_id: 'product',
      period,
      summary: `Product dept: ${this.ideasValidated} ideas validated, NPS at ${this.npsScore}, ` +
        `${this.featuresInBacklog} features in backlog. Time-to-MVP: ${this.lastTimeToMvpDays}d.`,
      metrics: { ...this.metrics },
      kpi_status: kpiStatus,
      blockers: [...this.blockers],
      next_actions: [
        'Complete Q2 roadmap RICE scoring',
        'Run 3 more user interviews for analytics feature',
        'Finalize PRD for onboarding-v2',
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
      `Product Report — ${period}`
    );

    return report;
  }

  // ── Escalation ────────────────────────────────────────────────────────────

  escalate(reason: string): void {
    const kpiStatus = this.buildKpiStatus();
    const affectedKpis = Object.entries(kpiStatus)
      .filter(([, v]) => !v.passing)
      .map(([id]) => id);

    this.routeEscalation(
      {
        severity: affectedKpis.length > 2 ? 'high' : 'medium',
        incident: `Product escalation: ${reason.substring(0, 80)}`,
        description: reason,
        impact: 'Risk of delayed time-to-market and reduced product-market fit score.',
        proposed_resolution: 'CEO review of product priorities and resource allocation.',
        blocker_since: new Date().toISOString(),
        affected_kpis: affectedKpis.length > 0 ? affectedKpis : undefined,
      },
      `[ESCALATION] Product — ${reason.substring(0, 60)}`
    );
  }

  // ── Public Domain Methods ─────────────────────────────────────────────────

  /** Simulate feature velocity metric update */
  updateFeatureAdoption(rate: number): void {
    this.featureAdoptionRate = Math.max(0, Math.min(100, rate));
    this.metrics['prod_feature_adoption'] = this.featureAdoptionRate;
  }

  /** Get current NPS score */
  getNpsScore(): number {
    return this.npsScore;
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createProductAgent(router: MessageRouter): ProductAgent {
  return new ProductAgent(router);
}

export function generateReport(agent: ProductAgent): Report {
  return agent.sendReport();
}
