// One Agent Corp — Trigger Engine
// Domain D-8: Manages triggers and schedules; matches events to actions

import type {
  Trigger,
  TriggerEvent,
  AutoAction,
  Schedule,
  TriggerHistoryEntry,
} from './types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nowIso(): string {
  return new Date().toISOString();
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Returns true if `event` matches `triggerEvent`.
 * Matching is type-first; optional fields are wildcards when absent.
 */
function eventMatches(triggerEvent: TriggerEvent, event: TriggerEvent): boolean {
  if (triggerEvent.type !== event.type) return false;

  switch (triggerEvent.type) {
    case 'cycle_completed': {
      const te = triggerEvent;
      const ev = event as typeof te;
      if (te.projectId && te.projectId !== ev.projectId) return false;
      if (te.department && te.department !== ev.department) return false;
      return true;
    }
    case 'cycle_result_ready': {
      const te = triggerEvent;
      const ev = event as typeof te;
      if (te.projectId && te.projectId !== ev.projectId) return false;
      return true;
    }
    case 'escalation_received': {
      const te = triggerEvent;
      const ev = event as typeof te;
      if (te.severity && te.severity !== ev.severity) return false;
      return true;
    }
    case 'gate_pending': {
      const te = triggerEvent;
      const ev = event as typeof te;
      if (te.projectId && te.projectId !== ev.projectId) return false;
      return true;
    }
    case 'kpi_breach': {
      const te = triggerEvent;
      const ev = event as typeof te;
      if (te.department && te.department !== ev.department) return false;
      if (te.kpiId && te.kpiId !== ev.kpiId) return false;
      return true;
    }
    case 'message_received': {
      const te = triggerEvent;
      const ev = event as typeof te;
      if (te.messageType && te.messageType !== ev.messageType) return false;
      if (te.from && te.from !== ev.from) return false;
      return true;
    }
    case 'schedule': {
      // schedule events are fired by the scheduler internally; cron must match exactly
      const te = triggerEvent;
      const ev = event as typeof te;
      return te.cron === ev.cron;
    }
    case 'pipeline_stage_complete': {
      const te = triggerEvent;
      const ev = event as typeof te;
      if (te.stage && te.stage !== ev.stage) return false;
      return true;
    }
    case 'velocity_drop': {
      const te = triggerEvent;
      const ev = event as typeof te;
      // fire if no threshold set, or if incoming velocity is at/below threshold
      if (te.threshold !== undefined && ev.threshold !== undefined) {
        return ev.threshold <= te.threshold;
      }
      return true;
    }
    default:
      return false;
  }
}

// ─── TriggerEngine ────────────────────────────────────────────────────────────

export class TriggerEngine {
  private triggers: Map<string, Trigger> = new Map();
  private schedules: Map<string, Schedule> = new Map();
  private history: Map<string, TriggerHistoryEntry[]> = new Map();

  // ── Trigger CRUD ────────────────────────────────────────────────────────────

  createTrigger(opts: Omit<Trigger, 'id' | 'createdAt' | 'fireCount'>): Trigger {
    const trigger: Trigger = {
      ...opts,
      id: generateId('trig'),
      createdAt: nowIso(),
      fireCount: 0,
    };
    this.triggers.set(trigger.id, trigger);
    this.history.set(trigger.id, []);
    return trigger;
  }

  removeTrigger(id: string): boolean {
    const existed = this.triggers.has(id);
    this.triggers.delete(id);
    this.history.delete(id);
    return existed;
  }

  enableTrigger(id: string): boolean {
    const trigger = this.triggers.get(id);
    if (!trigger) return false;
    trigger.enabled = true;
    return true;
  }

  disableTrigger(id: string): boolean {
    const trigger = this.triggers.get(id);
    if (!trigger) return false;
    trigger.enabled = false;
    return true;
  }

  // ── Event Firing ────────────────────────────────────────────────────────────

  /**
   * Matches `event` against all active triggers.
   * Returns the list of actions that should be executed.
   * Side-effects: updates fireCount, lastFiredAt, and disables one-shot triggers.
   */
  fire(event: TriggerEvent): AutoAction[] {
    const now = nowIso();
    const nowMs = Date.now();
    const matchedActions: AutoAction[] = [];

    for (const trigger of this.triggers.values()) {
      if (!trigger.enabled) continue;

      // Cooldown guard
      if (trigger.cooldownMs && trigger.lastFiredAt) {
        const lastMs = new Date(trigger.lastFiredAt).getTime();
        if (nowMs - lastMs < trigger.cooldownMs) continue;
      }

      // maxFires guard
      if (trigger.maxFires !== undefined && trigger.fireCount >= trigger.maxFires) {
        trigger.enabled = false;
        continue;
      }

      if (!eventMatches(trigger.event, event)) continue;

      // Match! Record and collect action
      trigger.fireCount += 1;
      trigger.lastFiredAt = now;

      const entry: TriggerHistoryEntry = { firedAt: now, action: trigger.action };
      this.history.get(trigger.id)!.push(entry);

      // Disable one-shot triggers after they fire
      if (trigger.maxFires === 1) {
        trigger.enabled = false;
      }

      matchedActions.push(trigger.action);
    }

    return matchedActions;
  }

  // ── Schedule CRUD ───────────────────────────────────────────────────────────

  createSchedule(opts: Omit<Schedule, 'id' | 'createdAt' | 'runCount'>): Schedule {
    const schedule: Schedule = {
      ...opts,
      id: generateId('sched'),
      createdAt: nowIso(),
      runCount: 0,
    };
    this.schedules.set(schedule.id, schedule);
    return schedule;
  }

  removeSchedule(id: string): boolean {
    const existed = this.schedules.has(id);
    this.schedules.delete(id);
    return existed;
  }

  /**
   * Called by an external scheduler when a schedule's cron fires.
   * Records the run and returns the action to execute.
   */
  runSchedule(id: string): AutoAction | undefined {
    const schedule = this.schedules.get(id);
    if (!schedule || !schedule.enabled) return undefined;

    schedule.runCount += 1;
    schedule.lastRunAt = nowIso();
    return schedule.action;
  }

  // ── Queries ─────────────────────────────────────────────────────────────────

  getActiveTriggers(): Trigger[] {
    return Array.from(this.triggers.values()).filter((t) => t.enabled);
  }

  getAllTriggers(): Trigger[] {
    return Array.from(this.triggers.values());
  }

  getSchedules(): Schedule[] {
    return Array.from(this.schedules.values());
  }

  getTrigger(id: string): Trigger | undefined {
    return this.triggers.get(id);
  }

  getSchedule(id: string): Schedule | undefined {
    return this.schedules.get(id);
  }

  getTriggerHistory(id: string): TriggerHistoryEntry[] {
    return this.history.get(id) ?? [];
  }

  /** Returns all triggers with the given tag */
  getTriggersByTag(tag: string): Trigger[] {
    return Array.from(this.triggers.values()).filter(
      (t) => t.tags?.includes(tag),
    );
  }

  /** Bulk-load pre-configured triggers (used by presets module) */
  loadTriggers(triggers: Trigger[]): void {
    for (const t of triggers) {
      this.triggers.set(t.id, { ...t });
      if (!this.history.has(t.id)) this.history.set(t.id, []);
    }
  }

  /** Bulk-load pre-configured schedules (used by presets module) */
  loadSchedules(schedules: Schedule[]): void {
    for (const s of schedules) {
      this.schedules.set(s.id, { ...s });
    }
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

let _instance: TriggerEngine | undefined;

export function getTriggerEngine(): TriggerEngine {
  if (!_instance) _instance = new TriggerEngine();
  return _instance;
}
