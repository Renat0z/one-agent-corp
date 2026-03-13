// One Agent Corp — Messaging Validation Schemas
// Domain D-2: Inline Zod-like validators — zero external dependencies

import type {
  Message,
  DirectiveMessage,
  ReportMessage,
  RequestMessage,
  EscalationMessage,
  DirectivePayload,
  ReportPayload,
  RequestPayload,
  EscalationPayload,
  ActorId,
  MessageType,
  Priority,
  MessageStatus,
} from './types';
import { PRIORITY_MAP } from './types';

// ─── Primitive Guards ─────────────────────────────────────────────────────────

function isString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0;
}

function isIsoDate(v: unknown): v is string {
  if (typeof v !== 'string') return false;
  const d = Date.parse(v);
  return !Number.isNaN(d);
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((item) => typeof item === 'string');
}

// ─── Validation Result ────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function ok(): ValidationResult {
  return { valid: true, errors: [] };
}

function fail(errors: string[]): ValidationResult {
  return { valid: false, errors };
}

function merge(...results: ValidationResult[]): ValidationResult {
  const errors = results.flatMap((r) => r.errors);
  return errors.length === 0 ? ok() : fail(errors);
}

// ─── Actor / Type / Status Guards ────────────────────────────────────────────

const VALID_DEPARTMENTS = new Set([
  'product', 'engineering', 'growth', 'sales', 'data', 'operations',
]);

/** Exported helper — used by templates.ts to validate DepartmentId at creation time */
export function isValidDepartment(v: unknown): boolean {
  return typeof v === 'string' && VALID_DEPARTMENTS.has(v);
}

const VALID_ACTORS = new Set([
  ...VALID_DEPARTMENTS, 'ceo', 'system',
]);

const VALID_TYPES = new Set<MessageType>([
  'directive', 'report', 'request', 'escalation',
]);

const VALID_STATUSES = new Set<MessageStatus>([
  'pending', 'in-progress', 'done', 'rejected', 'expired',
]);

const VALID_PRIORITIES = new Set<Priority>([1, 2, 3, 4]);

function validateActorId(v: unknown, field: string): ValidationResult {
  if (typeof v === 'string' && VALID_ACTORS.has(v as ActorId)) return ok();
  if (Array.isArray(v) && v.length > 0 && v.every((a) => VALID_ACTORS.has(a))) return ok();
  return fail([`${field} must be a valid ActorId (got: ${JSON.stringify(v)})`]);
}

// ─── Base Message Validator ───────────────────────────────────────────────────

export function validateBaseMessage(msg: unknown): ValidationResult {
  if (!isRecord(msg)) return fail(['Message must be a plain object']);

  const errors: string[] = [];

  if (!isString(msg['id']))          errors.push('id must be a non-empty string');
  if (!VALID_TYPES.has(msg['type'] as MessageType))
    errors.push(`type must be one of: ${[...VALID_TYPES].join(', ')}`);
  if (!VALID_PRIORITIES.has(msg['priority'] as Priority))
    errors.push(`priority must be one of: 1, 2, 3, 4`);
  if (!VALID_STATUSES.has(msg['status'] as MessageStatus))
    errors.push(`status must be one of: ${[...VALID_STATUSES].join(', ')}`);
  if (!isIsoDate(msg['created_at']))  errors.push('created_at must be a valid ISO-8601 date string');
  if (!isString(msg['subject']))      errors.push('subject must be a non-empty string');

  const fromResult = validateActorId(msg['from'], 'from');
  if (!fromResult.valid) errors.push(...fromResult.errors);

  const toResult = validateActorId(msg['to'], 'to');
  if (!toResult.valid) errors.push(...toResult.errors);

  if (msg['ttl_seconds'] !== undefined && typeof msg['ttl_seconds'] !== 'number')
    errors.push('ttl_seconds must be a number when provided');
  if (msg['correlation_id'] !== undefined && typeof msg['correlation_id'] !== 'string')
    errors.push('correlation_id must be a string when provided');
  if (msg['tags'] !== undefined && !isStringArray(msg['tags']))
    errors.push('tags must be a string array when provided');

  // Verify priority matches type
  const expectedPriority = PRIORITY_MAP[msg['type'] as MessageType];
  if (expectedPriority !== undefined && msg['priority'] !== expectedPriority) {
    errors.push(
      `priority for type '${msg['type']}' must be ${expectedPriority}, got ${msg['priority']}`
    );
  }

  return errors.length === 0 ? ok() : fail(errors);
}

// ─── Payload Validators ───────────────────────────────────────────────────────

export function validateDirectivePayload(payload: unknown): ValidationResult {
  if (!isRecord(payload)) return fail(['DirectivePayload must be a plain object']);

  const errors: string[] = [];

  if (!isString(payload['action']))    errors.push('action must be a non-empty string');
  if (!isString(payload['objective'])) errors.push('objective must be a non-empty string');
  if (payload['deadline'] !== undefined && typeof payload['deadline'] !== 'string')
    errors.push('deadline must be a string when provided');
  if (payload['resources'] !== undefined && !isStringArray(payload['resources']))
    errors.push('resources must be a string array when provided');
  if (payload['kpi_targets'] !== undefined && !isRecord(payload['kpi_targets']))
    errors.push('kpi_targets must be a plain object when provided');
  if (
    payload['kpi_targets'] !== undefined &&
    isRecord(payload['kpi_targets']) &&
    Object.values(payload['kpi_targets']).some((v) => typeof v !== 'number')
  ) {
    errors.push('kpi_targets values must all be numbers');
  }

  return errors.length === 0 ? ok() : fail(errors);
}

export function validateReportPayload(payload: unknown): ValidationResult {
  if (!isRecord(payload)) return fail(['ReportPayload must be a plain object']);

  const errors: string[] = [];

  if (!isString(payload['period']))  errors.push('period must be a non-empty string');
  if (!isString(payload['summary'])) errors.push('summary must be a non-empty string');
  if (!isRecord(payload['metrics']))  errors.push('metrics must be a plain object');
  if (
    isRecord(payload['metrics']) &&
    Object.values(payload['metrics']).some((v) => typeof v !== 'number')
  ) {
    errors.push('metrics values must all be numbers');
  }
  if (payload['blockers'] !== undefined && !isStringArray(payload['blockers']))
    errors.push('blockers must be a string array when provided');
  if (payload['next_actions'] !== undefined && !isStringArray(payload['next_actions']))
    errors.push('next_actions must be a string array when provided');
  if (payload['attachments'] !== undefined && !isStringArray(payload['attachments']))
    errors.push('attachments must be a string array when provided');

  return errors.length === 0 ? ok() : fail(errors);
}

export function validateRequestPayload(payload: unknown): ValidationResult {
  if (!isRecord(payload)) return fail(['RequestPayload must be a plain object']);

  const errors: string[] = [];

  if (!isString(payload['subject']))  errors.push('subject must be a non-empty string');
  if (!isString(payload['body']))     errors.push('body must be a non-empty string');
  if (typeof payload['approval_needed'] !== 'boolean')
    errors.push('approval_needed must be a boolean');
  if (payload['required_by'] !== undefined && typeof payload['required_by'] !== 'string')
    errors.push('required_by must be a string when provided');
  if (payload['options'] !== undefined && !isStringArray(payload['options']))
    errors.push('options must be a string array when provided');
  if (payload['dependencies'] !== undefined && !isStringArray(payload['dependencies']))
    errors.push('dependencies must be a string array when provided');

  return errors.length === 0 ? ok() : fail(errors);
}

export function validateEscalationPayload(payload: unknown): ValidationResult {
  if (!isRecord(payload)) return fail(['EscalationPayload must be a plain object']);

  const VALID_SEVERITIES = new Set(['low', 'medium', 'high', 'critical']);
  const errors: string[] = [];

  if (!VALID_SEVERITIES.has(payload['severity'] as string))
    errors.push(`severity must be one of: ${[...VALID_SEVERITIES].join(', ')}`);
  if (!isString(payload['incident']))    errors.push('incident must be a non-empty string');
  if (!isString(payload['description'])) errors.push('description must be a non-empty string');
  if (!isString(payload['impact']))      errors.push('impact must be a non-empty string');
  if (payload['proposed_resolution'] !== undefined && typeof payload['proposed_resolution'] !== 'string')
    errors.push('proposed_resolution must be a string when provided');
  if (payload['blocker_since'] !== undefined && !isIsoDate(payload['blocker_since']))
    errors.push('blocker_since must be a valid ISO-8601 date string when provided');
  if (payload['affected_kpis'] !== undefined && !isStringArray(payload['affected_kpis']))
    errors.push('affected_kpis must be a string array when provided');

  return errors.length === 0 ? ok() : fail(errors);
}

// ─── Full Message Validators ──────────────────────────────────────────────────

export function validateDirectiveMessage(msg: unknown): ValidationResult {
  const base = validateBaseMessage(msg);
  if (!base.valid) return base;

  const m = msg as Record<string, unknown>;
  if (m['type'] !== 'directive') return fail([`Expected type 'directive', got '${m['type']}'`]);
  if (m['from'] !== 'ceo') return fail([`Directive 'from' must be 'ceo', got '${m['from']}'`]);
  if (Array.isArray(m['to'])) {
    if (!(m['to'] as string[]).every((d) => VALID_DEPARTMENTS.has(d))) {
      return fail(['Directive \'to\' array must contain only valid department ids']);
    }
  } else if (!VALID_DEPARTMENTS.has(m['to'] as string)) {
    return fail(['Directive \'to\' must be a valid department id or array of department ids']);
  }

  const payload = validateDirectivePayload(m['payload']);
  return merge(base, payload);
}

export function validateReportMessage(msg: unknown): ValidationResult {
  const base = validateBaseMessage(msg);
  if (!base.valid) return base;

  const m = msg as Record<string, unknown>;
  if (m['type'] !== 'report') return fail([`Expected type 'report', got '${m['type']}'`]);
  if (!VALID_DEPARTMENTS.has(m['from'] as string))
    return fail([`Report 'from' must be a valid department id, got '${m['from']}'`]);
  if (m['to'] !== 'ceo')
    return fail([`Report 'to' must be 'ceo', got '${m['to']}'`]);

  const payload = validateReportPayload(m['payload']);
  return merge(base, payload);
}

export function validateRequestMessage(msg: unknown): ValidationResult {
  const base = validateBaseMessage(msg);
  if (!base.valid) return base;

  const m = msg as Record<string, unknown>;
  if (m['type'] !== 'request') return fail([`Expected type 'request', got '${m['type']}'`]);
  if (!VALID_DEPARTMENTS.has(m['from'] as string))
    return fail([`Request 'from' must be a valid department id, got '${m['from']}'`]);
  if (m['to'] !== 'ceo' && !VALID_DEPARTMENTS.has(m['to'] as string))
    return fail([`Request 'to' must be 'ceo' or a valid department id, got '${m['to']}'`]);

  const payload = validateRequestPayload(m['payload']);
  return merge(base, payload);
}

export function validateEscalationMessage(msg: unknown): ValidationResult {
  const base = validateBaseMessage(msg);
  if (!base.valid) return base;

  const m = msg as Record<string, unknown>;
  if (m['type'] !== 'escalation') return fail([`Expected type 'escalation', got '${m['type']}'`]);
  if (!VALID_DEPARTMENTS.has(m['from'] as string))
    return fail([`Escalation 'from' must be a valid department id, got '${m['from']}'`]);
  if (m['to'] !== 'ceo')
    return fail([`Escalation 'to' must be 'ceo', got '${m['to']}'`]);

  const payload = validateEscalationPayload(m['payload']);
  return merge(base, payload);
}

/** Dispatch validator by message type — returns typed ValidationResult */
export function validateMessage(msg: unknown): ValidationResult {
  if (!isRecord(msg)) return fail(['Message must be a plain object']);

  const type = msg['type'] as MessageType;

  switch (type) {
    case 'directive':  return validateDirectiveMessage(msg);
    case 'report':     return validateReportMessage(msg);
    case 'request':    return validateRequestMessage(msg);
    case 'escalation': return validateEscalationMessage(msg);
    default:
      return fail([`Unknown message type: '${String(type)}'`]);
  }
}

/** Strict assert — throws on invalid message */
export function assertValidMessage(msg: unknown): asserts msg is Message {
  const result = validateMessage(msg);
  if (!result.valid) {
    throw new Error(`Invalid message:\n  ${result.errors.join('\n  ')}`);
  }
}

// ─── Payload Type Guards ──────────────────────────────────────────────────────

export function isDirectivePayload(p: unknown): p is DirectivePayload {
  return validateDirectivePayload(p).valid;
}

export function isReportPayload(p: unknown): p is ReportPayload {
  return validateReportPayload(p).valid;
}

export function isRequestPayload(p: unknown): p is RequestPayload {
  return validateRequestPayload(p).valid;
}

export function isEscalationPayload(p: unknown): p is EscalationPayload {
  return validateEscalationPayload(p).valid;
}
