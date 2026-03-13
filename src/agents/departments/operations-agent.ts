// One Agent Corp — OperationsAgent
// Domain D-4: Operations department agent — infra, processes, compliance, burn rate
// Relevant directives: provision-infra, run-compliance-check, optimize-costs,
//                      automate-process, manage-vendor, update-budget, audit-security

import { MessageRouter } from '../../messaging/router';
import type { DirectiveMessage } from '../../messaging/types';
import { BaseDepartment, Task, TaskResult, Report } from './base-department';

// ─── Operations-specific action verbs ────────────────────────────────────────

const OPERATIONS_ACTIONS = new Set([
  'provision-infra',
  'run-compliance-check',
  'optimize-costs',
  'automate-process',
  'manage-vendor',
  'update-budget',
  'audit-security',
  'scale-infra',
  'reduce-burn-rate',
  'onboard-vendor',
  'reconcile-revenue',
  'setup-monitoring',
]);

// ─── Vendor record ────────────────────────────────────────────────────────────

interface Vendor {
  name: string;
  monthly_cost_usd: number;
  contract_end?: string;
  category: 'infrastructure' | 'marketing' | 'tooling' | 'service';
}

// ─── OperationsAgent ──────────────────────────────────────────────────────────

export class OperationsAgent extends BaseDepartment {
  /** Burn rate vs budget percentage (target: <= 90%) */
  private burnRateAccuracy = 87;
  /** Compliance incidents (target: 0) */
  private complianceIncidents = 0;
  /** Process automation rate (%) */
  private processAutomationRate = 65;
  /** Infrastructure cost per user (USD, target: <= $2) */
  private infraCostPerUser = 1.9;
  /** Vendor spend efficiency (%) */
  private vendorSpendEfficiency = 70;
  /** Monthly budget (USD) */
  private monthlyBudget = 15000;
  /** Active vendors */
  private vendors: Vendor[] = [
    { name: 'AWS', monthly_cost_usd: 1200, category: 'infrastructure' },
    { name: 'Stripe', monthly_cost_usd: 300, category: 'service' },
    { name: 'Intercom', monthly_cost_usd: 400, category: 'tooling' },
    { name: 'Google Ads', monthly_cost_usd: 2000, category: 'marketing' },
  ];
  /** Automated process list */
  private automatedProcesses: string[] = [
    'invoice-generation',
    'user-provisioning',
    'daily-backup',
    'cost-alerts',
  ];
  private totalProcesses = 10;

  constructor(router: MessageRouter) {
    super('operations', router);
    this.metrics['ops_burn_rate_accuracy'] = this.burnRateAccuracy;
    this.metrics['ops_compliance_incidents'] = this.complianceIncidents;
    this.metrics['ops_process_automation'] = this.processAutomationRate;
    this.metrics['ops_infra_cost_per_user'] = this.infraCostPerUser;
    this.metrics['ops_vendor_spend_efficiency'] = this.vendorSpendEfficiency;
  }

  // ── Directive Relevance ───────────────────────────────────────────────────

  protected isRelevantDirective(directive: DirectiveMessage): boolean {
    return OPERATIONS_ACTIONS.has(directive.payload.action);
  }

  // ── Task Execution ────────────────────────────────────────────────────────

  executeTask(task: Task): TaskResult {
    const now = new Date().toISOString();
    const ctx = (task.payload.context ?? {}) as Record<string, unknown>;

    switch (task.type) {
      case 'provision-infra': {
        const service = String(ctx.service ?? 'new-microservice');
        const estimatedCostPerUser = Number(ctx.cost_per_user ?? 0.2);
        this.infraCostPerUser = Math.min(5, this.infraCostPerUser + estimatedCostPerUser * 0.1);
        this.metrics['ops_infra_cost_per_user'] = this.infraCostPerUser;
        return {
          task_id: task.id,
          status: 'success',
          completed_at: now,
          output: {
            action: 'infra_provisioned',
            service,
            provider: 'AWS',
            environment: 'production',
            iac_applied: true,
            infra_cost_per_user: this.infraCostPerUser,
          },
          notes: `Infrastructure for '${service}' provisioned via IaC. Cost/user: $${this.infraCostPerUser.toFixed(2)}.`,
        };
      }

      case 'run-compliance-check': {
        const checkType = String(ctx.check ?? 'gdpr');
        const violations = Math.random() > 0.85 ? 1 : 0; // 15% chance of finding a violation

        if (violations > 0) {
          this.complianceIncidents += violations;
          this.metrics['ops_compliance_incidents'] = this.complianceIncidents;
          this.escalate(`Compliance violation found in ${checkType} audit`);
        }

        return {
          task_id: task.id,
          status: 'success',
          completed_at: now,
          output: {
            action: 'compliance_checked',
            check_type: checkType,
            violations_found: violations,
            total_incidents: this.complianceIncidents,
            status: violations === 0 ? 'compliant' : 'remediation-required',
            next_audit: '30 days',
          },
          notes: `${checkType.toUpperCase()} compliance check: ${violations === 0 ? 'PASSED' : `${violations} violation(s) found`}.`,
        };
      }

      case 'optimize-costs': {
        const targetArea = String(ctx.area ?? 'infrastructure');
        const savings = Math.floor(Math.random() * 500 + 200);
        this.infraCostPerUser = Math.max(0.5, this.infraCostPerUser - 0.15);
        this.burnRateAccuracy = Math.max(70, this.burnRateAccuracy - 2);
        this.metrics['ops_infra_cost_per_user'] = this.infraCostPerUser;
        this.metrics['ops_burn_rate_accuracy'] = this.burnRateAccuracy;
        return {
          task_id: task.id,
          status: 'success',
          completed_at: now,
          output: {
            action: 'costs_optimized',
            area: targetArea,
            monthly_savings_usd: savings,
            new_infra_cost_per_user: this.infraCostPerUser,
            burn_rate_accuracy: this.burnRateAccuracy,
          },
          notes: `Cost optimization in '${targetArea}': $${savings}/mo saved. Burn rate: ${this.burnRateAccuracy}%.`,
        };
      }

      case 'automate-process': {
        const processName = String(ctx.process ?? `process-${Date.now()}`);
        if (!this.automatedProcesses.includes(processName)) {
          this.automatedProcesses.push(processName);
        }
        this.processAutomationRate = Math.min(100,
          (this.automatedProcesses.length / this.totalProcesses) * 100
        );
        this.metrics['ops_process_automation'] = this.processAutomationRate;
        return {
          task_id: task.id,
          status: 'success',
          completed_at: now,
          output: {
            action: 'process_automated',
            process: processName,
            automation_tool: 'n8n',
            estimated_hours_saved_monthly: 12,
            automation_rate: this.processAutomationRate,
            total_automated: this.automatedProcesses.length,
          },
          notes: `Process '${processName}' automated. Rate: ${this.processAutomationRate.toFixed(0)}% (${this.automatedProcesses.length}/${this.totalProcesses}).`,
        };
      }

      case 'manage-vendor':
      case 'onboard-vendor': {
        const vendorName = String(ctx.vendor ?? 'new-vendor');
        const monthlyCost = Number(ctx.monthly_cost ?? 200);
        const category = (ctx.category ?? 'tooling') as Vendor['category'];

        if (task.type === 'onboard-vendor') {
          this.vendors.push({ name: vendorName, monthly_cost_usd: monthlyCost, category });
          const totalVendorSpend = this.vendors.reduce((s, v) => s + v.monthly_cost_usd, 0);
          this.burnRateAccuracy = Math.min(100,
            (totalVendorSpend / this.monthlyBudget) * 100
          );
          this.metrics['ops_burn_rate_accuracy'] = this.burnRateAccuracy;
        }

        if (this.burnRateAccuracy > 95) {
          this.escalate(`Vendor spend pushing burn rate to ${this.burnRateAccuracy.toFixed(0)}% of budget`);
        }

        return {
          task_id: task.id,
          status: 'success',
          completed_at: now,
          output: {
            action: task.type,
            vendor: vendorName,
            monthly_cost: monthlyCost,
            total_vendors: this.vendors.length,
            burn_rate_accuracy: this.burnRateAccuracy,
          },
          notes: `Vendor '${vendorName}' ${task.type === 'onboard-vendor' ? 'onboarded' : 'managed'}. Total vendors: ${this.vendors.length}.`,
        };
      }

      case 'update-budget': {
        const newBudget = Number(ctx.budget ?? this.monthlyBudget);
        this.monthlyBudget = newBudget;
        const totalVendorSpend = this.vendors.reduce((s, v) => s + v.monthly_cost_usd, 0);
        this.burnRateAccuracy = Math.min(100, (totalVendorSpend / this.monthlyBudget) * 100);
        this.metrics['ops_burn_rate_accuracy'] = this.burnRateAccuracy;
        return {
          task_id: task.id,
          status: 'success',
          completed_at: now,
          output: {
            action: 'budget_updated',
            new_monthly_budget: this.monthlyBudget,
            current_spend: totalVendorSpend,
            burn_rate_accuracy: this.burnRateAccuracy,
            runway_months: Math.floor(this.monthlyBudget / Math.max(1, totalVendorSpend) * 12),
          },
          notes: `Budget updated to $${this.monthlyBudget}/mo. Burn rate: ${this.burnRateAccuracy.toFixed(0)}%.`,
        };
      }

      case 'audit-security': {
        const riskLevel = Math.random() > 0.7 ? 'medium' : 'low';
        const findings = riskLevel === 'medium' ? 2 : 0;

        if (findings > 0) {
          this.blockers.push(`Security audit: ${findings} medium-risk findings require remediation`);
        }

        return {
          task_id: task.id,
          status: 'success',
          completed_at: now,
          output: {
            action: 'security_audited',
            risk_level: riskLevel,
            findings,
            controls_tested: 15,
            passed: 15 - findings,
            failed: findings,
            next_audit_days: 90,
          },
          notes: `Security audit: ${riskLevel} risk. ${findings} findings. ${15 - findings}/15 controls passed.`,
        };
      }

      case 'scale-infra': {
        const scaleFactor = Number(ctx.factor ?? 2);
        this.infraCostPerUser = Math.min(5, this.infraCostPerUser * (1 + (scaleFactor - 1) * 0.1));
        this.metrics['ops_infra_cost_per_user'] = this.infraCostPerUser;

        if (this.infraCostPerUser > 2) {
          this.escalate(`Infrastructure scaling pushed cost per user to $${this.infraCostPerUser.toFixed(2)}, above $2 target`);
        }

        return {
          task_id: task.id,
          status: 'success',
          completed_at: now,
          output: {
            action: 'infra_scaled',
            factor: scaleFactor,
            new_cost_per_user: this.infraCostPerUser,
            capacity: `${scaleFactor}x`,
            autoscaling_enabled: true,
          },
          notes: `Infrastructure scaled ${scaleFactor}x. Cost/user: $${this.infraCostPerUser.toFixed(2)}.`,
        };
      }

      case 'reduce-burn-rate': {
        const target = Number(ctx.target_percent ?? 85);
        const savings = this.burnRateAccuracy - target;
        this.burnRateAccuracy = target;
        this.metrics['ops_burn_rate_accuracy'] = this.burnRateAccuracy;
        return {
          task_id: task.id,
          status: 'success',
          completed_at: now,
          output: {
            action: 'burn_rate_reduced',
            previous_rate: this.burnRateAccuracy + savings,
            new_rate: this.burnRateAccuracy,
            reduction_percent: savings,
            measures_taken: ['Cancelled unused subscriptions', 'Renegotiated vendor contracts', 'Rightsized cloud resources'],
          },
          notes: `Burn rate reduced by ${savings.toFixed(1)}% to ${this.burnRateAccuracy}%.`,
        };
      }

      case 'reconcile-revenue':
      case 'setup-monitoring':
      default: {
        return {
          task_id: task.id,
          status: 'success',
          completed_at: now,
          output: { action: task.type, completed: true },
          notes: `Operations task '${task.type}' completed.`,
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
        `Operations KPI breach: ${failingKpis.join(', ')} — below targets in ${period}`
      );
    }

    const totalVendorSpend = this.vendors.reduce((s, v) => s + v.monthly_cost_usd, 0);

    const report: Report = {
      department_id: 'operations',
      period,
      summary:
        `Operations: burn rate ${this.burnRateAccuracy.toFixed(0)}% of budget ($${totalVendorSpend}/mo), ` +
        `${this.complianceIncidents} compliance incidents, ` +
        `automation ${this.processAutomationRate.toFixed(0)}%, ` +
        `infra cost $${this.infraCostPerUser.toFixed(2)}/user.`,
      metrics: { ...this.metrics },
      kpi_status: kpiStatus,
      blockers: [...this.blockers],
      next_actions: [
        'Automate 2 more manual processes (billing reconciliation, user offboarding)',
        'Renegotiate Intercom contract at renewal',
        'Complete GDPR annual review',
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
      `Operations Report — ${period}`
    );

    return report;
  }

  // ── Escalation ────────────────────────────────────────────────────────────

  escalate(reason: string): void {
    const isBudgetOverrun = this.burnRateAccuracy > 95;
    const isComplianceCrisis = this.complianceIncidents > 0;

    this.routeEscalation(
      {
        severity: isComplianceCrisis ? 'critical' : isBudgetOverrun ? 'high' : 'medium',
        incident: `Operations escalation: ${reason.substring(0, 80)}`,
        description: reason,
        impact: isComplianceCrisis
          ? `${this.complianceIncidents} compliance violation(s) — legal and regulatory risk.`
          : isBudgetOverrun
          ? `Burn rate at ${this.burnRateAccuracy.toFixed(0)}% — budget overrun imminent.`
          : 'Operational efficiency below targets — team capacity and cost at risk.',
        proposed_resolution: isComplianceCrisis
          ? 'Immediate legal review and remediation plan.'
          : 'CEO review of budget, vendor contracts, and headcount.',
        blocker_since: new Date().toISOString(),
        affected_kpis: ['ops_burn_rate_accuracy', 'ops_compliance_incidents', 'ops_process_automation'],
      },
      `[ESCALATION] Operations — ${reason.substring(0, 60)}`
    );
  }

  // ── Domain-specific Methods ───────────────────────────────────────────────

  getBurnRate(): number { return this.burnRateAccuracy; }
  getComplianceIncidents(): number { return this.complianceIncidents; }
  getVendors(): readonly Vendor[] { return [...this.vendors]; }
  getAutomatedProcesses(): readonly string[] { return [...this.automatedProcesses]; }
  getTotalVendorSpend(): number {
    return this.vendors.reduce((s, v) => s + v.monthly_cost_usd, 0);
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createOperationsAgent(router: MessageRouter): OperationsAgent {
  return new OperationsAgent(router);
}

export function generateReport(agent: OperationsAgent): Report {
  return agent.sendReport();
}
