// One Agent Corp — Automation & Triggers Types
// Domain D-8: Proactive automation layer for the CEO — triggers, schedules, pipelines

import type { DepartmentId } from '../types/organization';
import type { MessageType } from '../messaging/types';

// ─── Trigger Events ───────────────────────────────────────────────────────────

/** Discriminated union of all events that can fire a trigger */
export type TriggerEvent =
  | { type: 'cycle_completed'; projectId?: string; department?: DepartmentId }
  | { type: 'cycle_result_ready'; projectId?: string }
  | { type: 'escalation_received'; severity?: 'low' | 'medium' | 'high' | 'critical' }
  | { type: 'gate_pending'; projectId?: string }
  | { type: 'kpi_breach'; department?: DepartmentId; kpiId?: string }
  | { type: 'message_received'; messageType?: MessageType; from?: string }
  | { type: 'schedule'; cron: string }              // cron expression: "0 9 * * 1-5"
  | { type: 'pipeline_stage_complete'; stage?: string }
  | { type: 'velocity_drop'; threshold?: number };  // velocity fell below N cycles/week

// ─── Action Types ─────────────────────────────────────────────────────────────

export type ActionType =
  | 'claude_cli'       // executes `pi -p "prompt"`
  | 'send_directive'   // sends a directive via messaging system
  | 'send_report'      // generates an automatic report
  | 'create_cycle'     // creates a cycle automatically
  | 'notify_ceo'       // notifies CEO via message
  | 'run_script';      // executes a .bat/.ps1 script

export interface AutoAction {
  type: ActionType;
  /** Prompt string for claude_cli actions */
  prompt?: string;
  /** Optional cron cadence if this action is part of a schedule. 
   * Used for external task scheduling. */
  cron?: string;
  /** Script path for run_script actions (e.g. "C:/scripts/check-kpis.ps1") */
  command?: string;
  /** Directive payload for send_directive actions */
  directive?: {
    to: DepartmentId | DepartmentId[];
    action: string;
    objective: string;
    deadline?: string;
  };
  /** Cycle template for create_cycle actions */
  cycleTemplate?: {
    hypothesis: string;
    minimumTest: string;
    targetMetric: string;
    targetValue: number;
    department: DepartmentId;
    estimatedDuration: string;
    iceScore: { impact: number; confidence: number; ease: number };
  };
}

// ─── Trigger ──────────────────────────────────────────────────────────────────

export interface Trigger {
  id: string;
  name: string;
  description: string;
  /** The event that activates this trigger */
  event: TriggerEvent;
  /** The action to execute when the trigger fires */
  action: AutoAction;
  enabled: boolean;
  createdAt: string;
  lastFiredAt?: string;
  /** How many times this trigger has fired in total */
  fireCount: number;
  /** undefined = unlimited, 1 = one-shot (fires once then disables itself) */
  maxFires?: number;
  /** Minimum milliseconds between consecutive fires */
  cooldownMs?: number;
  tags?: string[];
}

// ─── Schedule ─────────────────────────────────────────────────────────────────

/** Recurring task with a fixed cron schedule */
export interface Schedule {
  id: string;
  name: string;
  /** Standard cron expression e.g. "0 9 * * 1-5" (weekdays at 9am) */
  cron: string;
  action: AutoAction;
  enabled: boolean;
  /** IANA timezone identifier e.g. "America/Sao_Paulo" */
  timezone: string;
  createdAt: string;
  lastRunAt?: string;
  nextRunAt?: string;
  runCount: number;
}

// ─── Pipeline ─────────────────────────────────────────────────────────────────

/** Automation pipeline: an ordered sequence of actions executed in chain */
export interface AutoPipeline {
  id: string;
  name: string;
  description: string;
  steps: PipelineStep[];
  status: 'idle' | 'running' | 'completed' | 'failed';
  /** Index of the currently executing step (0-based) */
  currentStep: number;
  /** ID of the trigger that initiated this pipeline run */
  triggeredBy?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface PipelineStep {
  /** Execution order (1-based for readability) */
  order: number;
  name: string;
  action: AutoAction;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  /** If true, pipeline continues even if this step fails */
  continueOnError: boolean;
  /** Captured stdout/result from the step execution */
  output?: string;
  startedAt?: string;
  completedAt?: string;
}

// ─── CLI Command ──────────────────────────────────────────────────────────────

/** A fully-formed CLI command ready for copy-paste or scripted execution */
export interface CLICommand {
  /** The raw command string e.g. 'pi -p "..."' */
  command: string;
  /** Human-readable explanation of what this command does */
  description: string;
  /** Extra CLI flags e.g. ["--model", "sonnet", "--allowedTools", "Read,Grep"] */
  flags?: string[];
  /** --max-turns override for agentic runs */
  maxTurns?: number;
  /** If set, appends "> outputFile" to the command string */
  outputFile?: string;
  /** Optional cron cadence for scheduled execution */
  cron?: string;
}

// ─── Trigger History Entry ────────────────────────────────────────────────────

export interface TriggerHistoryEntry {
  firedAt: string;
  action: AutoAction;
}
