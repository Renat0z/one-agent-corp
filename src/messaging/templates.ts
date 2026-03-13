// One Agent Corp — Message Templates
// Domain D-2: Factory functions for common messages — typed, validated at creation

import type {
  DirectiveMessage,
  ReportMessage,
  RequestMessage,
  EscalationMessage,
  DirectivePayload,
  ReportPayload,
  RequestPayload,
  EscalationPayload,
  ActorId,
} from './types';
import { PRIORITY_MAP } from './types';
import { isValidDepartment } from './schemas';
import type { DepartmentId } from '../types/organization';

// ─── ID Generator ─────────────────────────────────────────────────────────────

let _seq = 0;

function generateId(prefix: string): string {
  _seq += 1;
  const ts = Date.now().toString(36);
  const seq = _seq.toString(36).padStart(4, '0');
  return `${prefix}-${ts}-${seq}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

// ─── Generic Builders ─────────────────────────────────────────────────────────

export function createDirective(
  to: DepartmentId | DepartmentId[],
  subject: string,
  payload: DirectivePayload,
  options?: Partial<Pick<DirectiveMessage, 'correlation_id' | 'tags' | 'ttl_seconds'>>
): DirectiveMessage {
  const toList = Array.isArray(to) ? to : [to];
  const invalid = toList.filter((d) => !isValidDepartment(d));
  if (invalid.length > 0) {
    throw new Error(`createDirective: invalid department id(s): ${invalid.join(', ')}`);
  }
  return {
    id: generateId('dir'),
    type: 'directive',
    priority: PRIORITY_MAP['directive'],
    status: 'pending',
    from: 'ceo',
    to,
    subject,
    created_at: nowIso(),
    payload,
    ...options,
  };
}

export function createReport(
  from: DepartmentId,
  subject: string,
  payload: ReportPayload,
  options?: Partial<Pick<ReportMessage, 'correlation_id' | 'tags'>>
): ReportMessage {
  if (!isValidDepartment(from)) {
    throw new Error(`createReport: invalid department id: ${from}`);
  }
  return {
    id: generateId('rep'),
    type: 'report',
    priority: PRIORITY_MAP['report'],
    status: 'pending',
    from,
    to: 'ceo',
    subject,
    created_at: nowIso(),
    payload,
    ...options,
  };
}

export function createRequest(
  from: DepartmentId,
  to: 'ceo' | DepartmentId,
  subject: string,
  payload: RequestPayload,
  options?: Partial<Pick<RequestMessage, 'correlation_id' | 'tags' | 'ttl_seconds'>>
): RequestMessage {
  if (!isValidDepartment(from)) {
    throw new Error(`createRequest: invalid 'from' department id: ${from}`);
  }
  if (to !== 'ceo' && !isValidDepartment(to)) {
    throw new Error(`createRequest: invalid 'to' department id: ${to}`);
  }
  return {
    id: generateId('req'),
    type: 'request',
    priority: PRIORITY_MAP['request'],
    status: 'pending',
    from,
    to,
    subject,
    created_at: nowIso(),
    payload,
    ...options,
  };
}

export function createEscalation(
  from: DepartmentId,
  subject: string,
  payload: EscalationPayload,
  options?: Partial<Pick<EscalationMessage, 'correlation_id' | 'tags' | 'ttl_seconds'>>
): EscalationMessage {
  if (!isValidDepartment(from)) {
    throw new Error(`createEscalation: invalid department id: ${from}`);
  }
  return {
    id: generateId('esc'),
    type: 'escalation',
    priority: PRIORITY_MAP['escalation'],
    status: 'pending',
    from,
    to: 'ceo',
    subject,
    created_at: nowIso(),
    payload,
    ...options,
  };
}

// ─── Pre-defined Templates ────────────────────────────────────────────────────

/** CEO broadcasts a product launch directive to growth + sales */
export function launchDirective(opts: {
  productName: string;
  launchDate: string;
  targetRevenue?: number;
  channels?: string[];
  correlationId?: string;
}): DirectiveMessage {
  return createDirective(
    ['growth', 'sales'],
    `Launch directive: ${opts.productName}`,
    {
      action: 'execute_product_launch',
      objective: `Drive initial traction and revenue for ${opts.productName}`,
      deadline: opts.launchDate,
      resources: opts.channels ?? ['email', 'social', 'paid'],
      kpi_targets: {
        mql_count: 200,
        trial_signups: 100,
        ...(opts.targetRevenue !== undefined
          ? { monthly_recurring_revenue: opts.targetRevenue }
          : {}),
      },
      context: {
        product: opts.productName,
        channels: opts.channels ?? ['email', 'social', 'paid'],
      },
    },
    opts.correlationId ? { correlation_id: opts.correlationId } : undefined
  );
}

/** Department sends weekly status report */
export function weeklyStatusReport(opts: {
  from: DepartmentId;
  week: string;                         // e.g. "2026-W10"
  summary: string;
  metrics: Record<string, number>;
  blockers?: string[];
  nextActions?: string[];
}): ReportMessage {
  return createReport(
    opts.from,
    `Weekly Status Report — ${opts.week} — ${opts.from}`,
    {
      period: opts.week,
      summary: opts.summary,
      metrics: opts.metrics,
      blockers: opts.blockers,
      next_actions: opts.nextActions,
    }
  );
}

/** Department requests budget approval from CEO */
export function budgetApprovalRequest(opts: {
  from: DepartmentId;
  initiative: string;
  amount: number;
  currency?: string;
  deadline?: string;
  justification: string;
}): RequestMessage {
  const currency = opts.currency ?? 'USD';
  return createRequest(
    opts.from,
    'ceo',
    `Budget approval request: ${opts.initiative}`,
    {
      subject: `Budget for ${opts.initiative}`,
      body: `${opts.justification}\n\nRequested: ${opts.amount} ${currency}`,
      required_by: opts.deadline,
      approval_needed: true,
      options: ['approve', 'reject', 'request-revision'],
    }
  );
}

/** Department escalates a blocking incident to CEO */
export function blockingEscalation(opts: {
  from: DepartmentId;
  incident: string;
  description: string;
  impact: string;
  severity?: EscalationPayload['severity'];
  proposedResolution?: string;
  blockerSince?: string;
  affectedKpis?: string[];
}): EscalationMessage {
  return createEscalation(
    opts.from,
    `[ESCALATION] ${opts.incident}`,
    {
      severity: opts.severity ?? 'high',
      incident: opts.incident,
      description: opts.description,
      impact: opts.impact,
      proposed_resolution: opts.proposedResolution,
      blocker_since: opts.blockerSince ?? nowIso(),
      affected_kpis: opts.affectedKpis,
    },
    { ttl_seconds: 3600 }  // escalations expire in 1 hour if unread
  );
}

/** CEO broadcasts a directive to ALL departments */
export function broadcastDirective(opts: {
  action: string;
  objective: string;
  deadline?: string;
  context?: Record<string, unknown>;
}): DirectiveMessage {
  const allDepts: DepartmentId[] = [
    'product', 'engineering', 'growth', 'sales', 'data', 'operations',
  ];
  return createDirective(
    allDepts,
    `[BROADCAST] ${opts.action}`,
    {
      action: opts.action,
      objective: opts.objective,
      deadline: opts.deadline,
      context: opts.context,
    },
    { tags: ['broadcast'] }
  );
}

/** Engineering requests collaboration from Product on a spec */
export function specCollaborationRequest(opts: {
  from: DepartmentId;
  to: DepartmentId;
  featureName: string;
  dueDate?: string;
  details: string;
}): RequestMessage {
  return createRequest(
    opts.from,
    opts.to,
    `Spec collaboration needed: ${opts.featureName}`,
    {
      subject: `Spec: ${opts.featureName}`,
      body: opts.details,
      required_by: opts.dueDate,
      approval_needed: false,
    }
  );
}

/** Growth reports a critical conversion metric update */
export function conversionMetricsReport(opts: {
  from: DepartmentId;
  period: string;
  trialSignups: number;
  paidConversions: number;
  churnCount: number;
  mqlCount?: number;
}): ReportMessage {
  return createReport(
    opts.from,
    `Conversion Metrics — ${opts.period}`,
    {
      period: opts.period,
      summary: `Signups: ${opts.trialSignups} | Paid: ${opts.paidConversions} | Churn: ${opts.churnCount}`,
      metrics: {
        trial_signups: opts.trialSignups,
        paid_conversions: opts.paidConversions,
        churn_count: opts.churnCount,
        ...(opts.mqlCount !== undefined ? { mql_count: opts.mqlCount } : {}),
      },
    }
  );
}

/** CEO sends ACID-formatted directive (Ação, Contexto, Indicador, Deadline) */
export function acidDirective(opts: {
  to: DepartmentId | DepartmentId[];
  action: string;        // A = O que precisa ser feito (verbo imperativo)
  context: string;       // C = Por que isso importa (1 frase)
  indicator: string;     // I = Como sei que está feito (métrica ou entregável)
  deadline: string;      // D = Até quando
  correlationId?: string;
}): DirectiveMessage {
  return createDirective(
    opts.to,
    `[ACID] ${opts.action}`,
    {
      action: opts.action,
      objective: `[CONTEXTO] ${opts.context}\n[INDICADOR] ${opts.indicator}`,
      deadline: opts.deadline,
    },
    {
      tags: ['acid'],
      ...(opts.correlationId ? { correlation_id: opts.correlationId } : {}),
    }
  );
}

/** Department sends structured Decision Doc to CEO */
export function decisionDocRequest(opts: {
  from: DepartmentId;
  title: string;
  context: string;                    // 2-3 frases do problema
  options: Array<{
    label: string;                    // "A", "B", "C"
    description: string;
    pros: string[];
    cons: string[];
  }>;
  recommendation: string;            // opção preferida e por quê
  decisionDeadline: string;          // se CEO não responder, recomendação é executada
  reversible: boolean;               // decisão reversível = time decide sozinho
}): RequestMessage {
  const optionsFormatted = opts.options
    .map((o) => {
      const pros = o.pros.map((p) => `    + ${p}`).join('\n');
      const cons = o.cons.map((c) => `    - ${c}`).join('\n');
      return `  Opção ${o.label}: ${o.description}\n${pros}\n${cons}`;
    })
    .join('\n\n');

  const reversibleNote = opts.reversible
    ? `\n\nNota: Se sem resposta até ${opts.decisionDeadline}, recomendação será executada.`
    : '';

  const body = `DECISÃO: ${opts.title}

CONTEXTO:
${opts.context}

OPÇÕES:
${optionsFormatted}

RECOMENDAÇÃO:
${opts.recommendation}

PRAZO: ${opts.decisionDeadline}${reversibleNote}`;

  return createRequest(
    opts.from,
    'ceo',
    `[DECISION DOC] ${opts.title}`,
    {
      subject: opts.title,
      body,
      required_by: opts.decisionDeadline,
      approval_needed: !opts.reversible,
      options: opts.options.map((o) => o.label),
    },
    { tags: ['decision-doc'] }
  );
}

// ─── Templates Namespace (convenience re-export) ──────────────────────────────

export const MessageTemplates = {
  launchDirective,
  weeklyStatusReport,
  budgetApprovalRequest,
  blockingEscalation,
  broadcastDirective,
  specCollaborationRequest,
  conversionMetricsReport,
  acidDirective,
  decisionDocRequest,
  // Generic builders
  createDirective,
  createReport,
  createRequest,
  createEscalation,
} as const;
