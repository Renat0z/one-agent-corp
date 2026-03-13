// One Agent Corp — Messaging System Types
// Domain D-2: Typed message protocol for CEO<->Department communication

import type { DepartmentId } from '../types/organization';

// ─── Enumerations ────────────────────────────────────────────────────────────

export type MessageType = 'directive' | 'report' | 'request' | 'escalation';

export type Priority = 1 | 2 | 3 | 4;
// 1 = CRITICAL (escalation), 2 = HIGH (directive), 3 = MEDIUM (request), 4 = LOW (report)

export const PRIORITY_MAP: Record<MessageType, Priority> = {
  escalation: 1,
  directive:  2,
  request:    3,
  report:     4,
} as const;

export type MessageStatus =
  | 'pending'      // enqueued, not yet consumed
  | 'in-progress'  // being processed by receiver
  | 'done'         // successfully handled
  | 'rejected'     // explicitly rejected by receiver
  | 'expired';     // TTL exceeded without being consumed

export type ActorId = DepartmentId | 'ceo' | 'system';

// ─── Payload Shapes ──────────────────────────────────────────────────────────

/** CEO → Department: instruction that must be executed */
export interface DirectivePayload {
  action: string;                     // verb describing what must be done
  objective: string;                  // expected outcome
  deadline?: string;                  // ISO-8601 or relative ("3d", "EOD")
  resources?: string[];               // allocated resources / budget tokens
  kpi_targets?: Record<string, number>; // KPI id → target value
  context?: Record<string, unknown>; // arbitrary extra context
}

/** Department → CEO: status or results update */
export interface ReportPayload {
  period: string;                     // "2026-W10", "2026-03-11", etc.
  summary: string;
  metrics: Record<string, number>;    // KPI id → current value
  blockers?: string[];
  next_actions?: string[];
  attachments?: string[];             // file paths or references
}

/** Department → CEO or Department → Department: something is needed */
export interface RequestPayload {
  subject: string;
  body: string;
  required_by?: string;              // ISO-8601 deadline
  options?: string[];                // alternative choices for approver
  approval_needed: boolean;
  dependencies?: string[];           // IDs of other requests this depends on
}

/** Department → CEO: urgent issue requiring immediate attention */
export interface EscalationPayload {
  severity: 'low' | 'medium' | 'high' | 'critical';
  incident: string;                  // brief title
  description: string;
  impact: string;                    // business impact statement
  proposed_resolution?: string;
  blocker_since?: string;            // ISO-8601 — when this started blocking
  affected_kpis?: string[];          // KPI ids at risk
}

export type MessagePayload =
  | DirectivePayload
  | ReportPayload
  | RequestPayload
  | EscalationPayload;

// ─── Core Message Types ───────────────────────────────────────────────────────

interface BaseMessage {
  id: string;
  type: MessageType;
  priority: Priority;
  status: MessageStatus;
  from: ActorId;
  to: ActorId | ActorId[];           // broadcast possible
  subject: string;
  created_at: string;                // ISO-8601
  ttl_seconds?: number;             // optional TTL
  correlation_id?: string;          // links related messages (reply-to, chain)
  tags?: string[];
}

export interface DirectiveMessage extends BaseMessage {
  type: 'directive';
  from: 'ceo';
  to: DepartmentId | DepartmentId[];
  payload: DirectivePayload;
}

export interface ReportMessage extends BaseMessage {
  type: 'report';
  from: DepartmentId;
  to: 'ceo';
  payload: ReportPayload;
}

export interface RequestMessage extends BaseMessage {
  type: 'request';
  from: DepartmentId;
  to: 'ceo' | DepartmentId;
  payload: RequestPayload;
}

export interface EscalationMessage extends BaseMessage {
  type: 'escalation';
  from: DepartmentId;
  to: 'ceo';
  payload: EscalationPayload;
}

/** Discriminated union — use `message.type` to narrow */
export type Message =
  | DirectiveMessage
  | ReportMessage
  | RequestMessage
  | EscalationMessage;

// ─── Router Contract ──────────────────────────────────────────────────────────

export interface RoutingResult {
  delivered: boolean;
  destination: ActorId | ActorId[];
  timestamp: string;
  error?: string;
}

export interface MessageHandler {
  (message: Message): void | Promise<void>;
}

export interface Router {
  register(destination: ActorId, handler: MessageHandler): void;
  unregister(destination: ActorId): void;
  route(message: Message): RoutingResult;
  getHandlers(): ReadonlyMap<ActorId, MessageHandler>;
}

// ─── Queue Contract ───────────────────────────────────────────────────────────

export interface QueueEntry {
  message: Message;
  enqueued_at: string;
  attempts: number;
}

export interface Queue {
  enqueue(message: Message): void;
  dequeue(): Message | undefined;
  peek(): Message | undefined;
  size(): number;
  isEmpty(): boolean;
  drain(): Message[];
  getAll(): readonly QueueEntry[];
  clear(): void;
}
