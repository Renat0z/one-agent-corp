// One Agent Corp — Automation Presets
// Domain D-8: Pre-configured triggers, schedules, and pipelines ready to activate

import type { Trigger, Schedule, AutoPipeline } from './types';
import { getTriggerEngine } from './trigger-engine';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nowIso(): string {
  return new Date().toISOString();
}

// ─── Preset Schedules ─────────────────────────────────────────────────────────

/**
 * Weekday morning standup: CEO queries status of all departments at 9am Mon-Fri.
 */
const dailyStandup: Schedule = {
  id: 'sched-daily-standup',
  name: 'Daily Standup',
  cron: '0 9 * * 1-5',
  timezone: 'America/Sao_Paulo',
  enabled: true,
  createdAt: nowIso(),
  runCount: 0,
  action: {
    type: 'claude_cli',
    prompt:
      'Navigate to one-agent-corp. Import { getCEOAgent } from "./src/agents/ceo/ceo-agent". ' +
      'Execute ceo.execute({ kind: "status", scope: "all", includeKpis: true, includeEscalations: true }). ' +
      'Display a formatted standup report: department health, open escalations, pending gates, and cycle velocity for the current week.',
  },
};

/**
 * Friday afternoon scorecard: CEO generates full weekly scorecard at 18h.
 */
const weeklyScorecard: Schedule = {
  id: 'sched-weekly-scorecard',
  name: 'Weekly Scorecard',
  cron: '0 18 * * 5',
  timezone: 'America/Sao_Paulo',
  enabled: true,
  createdAt: nowIso(),
  runCount: 0,
  action: {
    type: 'claude_cli',
    prompt:
      'Navigate to one-agent-corp. Import { getCEOAgent } from "./src/agents/ceo/ceo-agent". ' +
      'Execute ceo.execute({ kind: "cycle-velocity" }) and ceo.execute({ kind: "status", scope: "all", includeKpis: true }). ' +
      'Generate a weekly scorecard showing: (1) cycle velocity rating vs target 3+/week, ' +
      '(2) top 3 KPIs in red, (3) all active project gates, (4) MRR and burn rate vs plan, ' +
      '(5) top 3 recommended ICE cycles for next week.',
  },
};

/**
 * Weekday midday cycle velocity check: alerts CEO if velocity < 3/week.
 */
const cycleVelocityCheck: Schedule = {
  id: 'sched-cycle-velocity-check',
  name: 'Cycle Velocity Check',
  cron: '0 12 * * 1-5',
  timezone: 'America/Sao_Paulo',
  enabled: true,
  createdAt: nowIso(),
  runCount: 0,
  action: {
    type: 'claude_cli',
    prompt:
      'Navigate to one-agent-corp. Import { getCEOAgent } from "./src/agents/ceo/ceo-agent". ' +
      'Execute ceo.execute({ kind: "cycle-velocity" }). ' +
      'If cycleVelocity < 3, print a RED ALERT: "VELOCITY WARNING: Only N cycles completed this week. ' +
      'Target is 3+. List all cycles currently in hypothesis or testing status sorted by ICE score descending. ' +
      'Recommend the top 2 cycles to expedite." ' +
      'If velocity >= 3, print GREEN: "Velocity on track: N cycles completed."',
  },
};

/**
 * Weekday morning gate reminder: reminds CEO of pending pipeline gates at 10h.
 */
const pipelineGateReminder: Schedule = {
  id: 'sched-gate-reminder',
  name: 'Pipeline Gate Reminder',
  cron: '0 10 * * 1-5',
  timezone: 'America/Sao_Paulo',
  enabled: true,
  createdAt: nowIso(),
  runCount: 0,
  action: {
    type: 'claude_cli',
    prompt:
      'Navigate to one-agent-corp. Import { getPipelineEngine } from "./src/pipeline/pipeline-engine". ' +
      'Call pipelineEngine.getPendingGateProjects(). ' +
      'If there are pending gates, print each project with: name, current stage, gate score, and recommendation. ' +
      'For each gate, generate the approval command: ceo.execute({ kind: "approve" | "reject", proposalId: ... }). ' +
      'If no pending gates, print: "No gates pending. Pipeline flowing."',
  },
};

export const PRESET_SCHEDULES: Record<string, Schedule> = {
  dailyStandup,
  weeklyScorecard,
  cycleVelocityCheck,
  pipelineGateReminder,
};

// ─── Preset Triggers ──────────────────────────────────────────────────────────

/**
 * When a cycle reaches status 'result', notify CEO with Decision Doc prompt.
 */
const onCycleResult: Trigger = {
  id: 'trig-cycle-result',
  name: 'Cycle Result Ready',
  description: 'When a cycle reaches result status, prompt CEO for a scale/adjust/kill decision.',
  event: { type: 'cycle_result_ready' },
  action: {
    type: 'claude_cli',
    prompt:
      'Navigate to one-agent-corp. Import { getCEOAgent } from "./src/agents/ceo/ceo-agent". ' +
      'Execute ceo.execute({ kind: "cycle-board" }) and filter cycles with status "result". ' +
      'For each cycle in result status, display a Decision Doc: ' +
      'HYPOTHESIS, RESULT (metric value vs target), SUGGESTED DECISION (scale/adjust/kill), REASON, NEXT STEPS. ' +
      'Then prompt: "Run ceo.execute({ kind: \'decide-cycle\', cycleId: \'<id>\', decision: \'scale\'|\'adjust\'|\'kill\', reason: \'...\' }) to decide."',
  },
  enabled: true,
  createdAt: nowIso(),
  fireCount: 0,
  cooldownMs: 5 * 60 * 1000, // 5 minute cooldown to avoid duplicate notifications
  tags: ['cycles', 'decision'],
};

/**
 * When a critical escalation arrives, generate immediate alert with resolution path.
 */
const onEscalationCritical: Trigger = {
  id: 'trig-escalation-critical',
  name: 'Critical Escalation Alert',
  description: 'Fires immediately on any critical severity escalation and generates resolution options.',
  event: { type: 'escalation_received', severity: 'critical' },
  action: {
    type: 'claude_cli',
    prompt:
      'CRITICAL ESCALATION RECEIVED. Navigate to one-agent-corp. Import { getCEOAgent } from "./src/agents/ceo/ceo-agent". ' +
      'Execute ceo.execute({ kind: "status", scope: "all", includeEscalations: true }). ' +
      'Identify the critical escalation. Display: incident title, department, business impact, proposed resolution. ' +
      'Generate THREE response options: (1) approve resolution, (2) escalate to operations, (3) request more info. ' +
      'For each option, show the exact ceo.execute() command to run.',
  },
  enabled: true,
  createdAt: nowIso(),
  fireCount: 0,
  cooldownMs: 2 * 60 * 1000, // 2 minute cooldown
  tags: ['escalation', 'critical', 'alert'],
};

/**
 * When a KPI breaches its threshold, suggest a corrective cycle.
 */
const onKpiBreach: Trigger = {
  id: 'trig-kpi-breach',
  name: 'KPI Breach — Suggest Corrective Cycle',
  description: 'When a KPI turns red, prompts CEO to create a corrective experiment cycle.',
  event: { type: 'kpi_breach' },
  action: {
    type: 'claude_cli',
    prompt:
      'KPI BREACH DETECTED. Navigate to one-agent-corp. Import { getCEOAgent } from "./src/agents/ceo/ceo-agent". ' +
      'Execute ceo.execute({ kind: "status", scope: "all", includeKpis: true }). ' +
      'Identify all KPIs with health "red". For each red KPI: ' +
      '(1) show current vs target value, (2) identify the owning department, ' +
      '(3) suggest a corrective hypothesis in format "If I do X, metric Y will recover to Z%", ' +
      '(4) estimate a minimum test that can be run in < 2 hours, ' +
      '(5) generate ceo.execute({ kind: "create-cycle", ... }) command with ICE score estimate.',
  },
  enabled: true,
  createdAt: nowIso(),
  fireCount: 0,
  cooldownMs: 30 * 60 * 1000, // 30 minute cooldown per KPI breach
  tags: ['kpi', 'cycles', 'corrective'],
};

/**
 * When velocity drops below threshold, CEO receives alert + immediate action suggestions.
 */
const onVelocityDrop: Trigger = {
  id: 'trig-velocity-drop',
  name: 'Velocity Drop Alert',
  description: 'Fires when cycle velocity falls below 2/week and suggests acceleration tactics.',
  event: { type: 'velocity_drop', threshold: 2 },
  action: {
    type: 'claude_cli',
    prompt:
      'VELOCITY DROP ALERT. Navigate to one-agent-corp. Import { getCEOAgent } from "./src/agents/ceo/ceo-agent". ' +
      'Execute ceo.execute({ kind: "cycle-velocity" }) and ceo.execute({ kind: "cycle-board" }). ' +
      'Display: current velocity, rating (should be "beginner" to trigger this), all blocked cycles. ' +
      'Then suggest: (1) top 3 hypothesis-status cycles by ICE score to start immediately, ' +
      '(2) any cycles in "testing" that have been running > 48h and should be concluded, ' +
      '(3) a broadcast directive to all departments to submit new cycle hypotheses by EOD. ' +
      'Generate the exact ceo.execute() commands for each suggestion.',
  },
  enabled: true,
  createdAt: nowIso(),
  fireCount: 0,
  cooldownMs: 24 * 60 * 60 * 1000, // 24 hour cooldown (fire at most once per day)
  tags: ['velocity', 'cycles', 'alert'],
};

/**
 * When a pipeline stage completes, auto-request gate approval from CEO.
 */
const onPipelineStageComplete: Trigger = {
  id: 'trig-pipeline-stage-complete',
  name: 'Pipeline Stage Complete — Request Gate Approval',
  description: 'When any pipeline stage completes, generates the gate approval request for CEO review.',
  event: { type: 'pipeline_stage_complete' },
  action: {
    type: 'claude_cli',
    prompt:
      'PIPELINE STAGE COMPLETED. Navigate to one-agent-corp. Import { getPipelineEngine } from "./src/pipeline/pipeline-engine". ' +
      'Call pipelineEngine.getPendingGateProjects() to find the newly completed stage. ' +
      'Display the gate evaluation: stage completed, pass criteria results, gate score (0-100), recommendation. ' +
      'Generate the CEO command to process the gate decision: ' +
      'pipelineEngine.applyGateDecision(projectId, "approve" | "request-changes", { reason: "...", requiredChanges: [...] }). ' +
      'If gate score >= 70, recommend approve. If < 70, recommend request-changes with specific gaps to address.',
  },
  enabled: true,
  createdAt: nowIso(),
  fireCount: 0,
  cooldownMs: 10 * 60 * 1000, // 10 minute cooldown
  tags: ['pipeline', 'gate', 'approval'],
};

export const PRESET_TRIGGERS: Record<string, Trigger> = {
  onCycleResult,
  onEscalationCritical,
  onKpiBreach,
  onVelocityDrop,
  onPipelineStageComplete,
};

// ─── Preset Pipelines ─────────────────────────────────────────────────────────

/**
 * New Project Setup pipeline: launch → pipeline create → first cycle.
 * Replace PROJECT_NAME and PROJECT_DESCRIPTION before using.
 */
function buildNewProjectSetupPipeline(projectName: string, description: string): AutoPipeline {
  return {
    id: `pipeline-new-project-${Date.now()}`,
    name: `New Project Setup: ${projectName}`,
    description: `Automated project onboarding pipeline for ${projectName}`,
    status: 'idle',
    currentStep: 0,
    steps: [
      {
        order: 1,
        name: 'CEO Launch Command',
        status: 'pending',
        continueOnError: false,
        action: {
          type: 'claude_cli',
          prompt:
            `Navigate to one-agent-corp. Import { getCEOAgent } from "./src/agents/ceo/ceo-agent". ` +
            `Execute ceo.execute({ kind: "launch-project", projectName: "${projectName}", ` +
            `description: "${description}", budget: 15000, targetMrr: 5000, timeline: "4 weeks", ` +
            `departments: ["product", "engineering", "growth"], ` +
            `strategicAlignment: "Core micro-SaaS factory mission", riskLevel: "medium", priority: "high" }). ` +
            `Display the CommandResult and confirm project was created.`,
        },
      },
      {
        order: 2,
        name: 'Create Pipeline Project',
        status: 'pending',
        continueOnError: false,
        action: {
          type: 'claude_cli',
          prompt:
            `Navigate to one-agent-corp. Import { getPipelineEngine } from "./src/pipeline/pipeline-engine". ` +
            `Create a new pipeline project: pipelineEngine.createProject({ name: "${projectName}", ` +
            `description: "${description}", targetMarket: "B2B SaaS", monthlyBudgetUsd: 15000, teamSize: 3 }). ` +
            `Then call pipelineEngine.startProject(project.id). Display the created project and its initial stage.`,
        },
      },
      {
        order: 3,
        name: 'Broadcast Kickoff Directive',
        status: 'pending',
        continueOnError: false,
        action: {
          type: 'send_directive',
          directive: {
            to: ['product', 'engineering', 'growth'],
            action: 'kickoff_project',
            objective: `Initialize work on ${projectName} — submit first cycle hypothesis within 24h`,
            deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          },
        },
      },
      {
        order: 4,
        name: 'Create First Experiment Cycle',
        status: 'pending',
        continueOnError: true,
        action: {
          type: 'claude_cli',
          prompt:
            `Navigate to one-agent-corp. Import { getCEOAgent } from "./src/agents/ceo/ceo-agent". ` +
            `Create the first validation cycle: ceo.execute({ kind: "create-cycle", projectId: "<projectId>", ` +
            `hypothesis: "If we build a landing page for ${projectName} and drive 100 visitors, we will get 10 signups (10% conversion)", ` +
            `minimumTest: "Build landing page with email capture in 2h and run $50 Google Ads for 24h", ` +
            `targetMetric: "signup_conversion_rate", targetValue: 0.10, ` +
            `department: "growth", estimatedDuration: "24h", ` +
            `iceScore: { impact: 9, confidence: 7, ease: 8 } }). Display the created cycle.`,
        },
      },
    ],
  };
}

/**
 * Weekly Review pipeline: reports from all depts → scorecard → top 3 ICE cycles.
 */
const weeklyReviewPipeline: AutoPipeline = {
  id: 'pipeline-weekly-review',
  name: 'Weekly Review',
  description: 'Generates reports from all departments, compiles scorecard, and identifies top 3 ICE cycles for next week',
  status: 'idle',
  currentStep: 0,
  steps: [
    {
      order: 1,
      name: 'Request Department Reports',
      status: 'pending',
      continueOnError: false,
      action: {
        type: 'claude_cli',
        prompt:
          'Navigate to one-agent-corp. Import { getCEOAgent } from "./src/agents/ceo/ceo-agent". ' +
          'Execute ceo.execute({ kind: "broadcast", action: "submit_weekly_report", ' +
          'objective: "Submit weekly KPI report with metrics, blockers, and next actions", ' +
          'deadline: "EOD Friday" }). ' +
          'Confirm the broadcast was delivered to all 6 departments.',
      },
    },
    {
      order: 2,
      name: 'Compile Full Status Snapshot',
      status: 'pending',
      continueOnError: false,
      action: {
        type: 'claude_cli',
        prompt:
          'Navigate to one-agent-corp. Import { getCEOAgent } from "./src/agents/ceo/ceo-agent". ' +
          'Execute ceo.execute({ kind: "status", scope: "all", includeKpis: true, includeEscalations: true }). ' +
          'Display: (1) each department health (green/yellow/red), (2) all KPI values vs targets, ' +
          '(3) open escalations by severity, (4) active projects and their pipeline stages.',
      },
    },
    {
      order: 3,
      name: 'Cycle Velocity Review',
      status: 'pending',
      continueOnError: false,
      action: {
        type: 'claude_cli',
        prompt:
          'Navigate to one-agent-corp. Import { getCEOAgent } from "./src/agents/ceo/ceo-agent". ' +
          'Execute ceo.execute({ kind: "cycle-velocity" }) and ceo.execute({ kind: "cycle-board" }). ' +
          'Display: cycles completed this week, velocity rating, scale rate, kill rate. ' +
          'List all cycles by status. Identify any cycles stuck in "testing" for more than 3 days.',
      },
    },
    {
      order: 4,
      name: 'Compile Weekly Scorecard',
      status: 'pending',
      continueOnError: false,
      action: {
        type: 'send_report',
      },
    },
    {
      order: 5,
      name: 'Identify Top 3 ICE Cycles for Next Week',
      status: 'pending',
      continueOnError: true,
      action: {
        type: 'claude_cli',
        prompt:
          'Navigate to one-agent-corp. Import { getCEOAgent } from "./src/agents/ceo/ceo-agent". ' +
          'Execute ceo.execute({ kind: "cycle-board" }) and filter status "hypothesis". ' +
          'Sort by ICE score descending. Display the top 3 cycles to prioritize next week with: ' +
          'hypothesis, minimum test, estimated duration, ICE score breakdown (impact/confidence/ease). ' +
          'Generate the ceo.execute({ kind: "create-cycle", ... }) command for each if not yet created. ' +
          'End with a recommended focus message: "Next week priority: [Cycle 1 name] by [dept]."',
      },
    },
  ],
};

export const PRESET_PIPELINES = {
  /** Factory function — pass project details to get a configured pipeline */
  newProjectSetup: buildNewProjectSetupPipeline,
  weeklyReview: weeklyReviewPipeline,
};

// ─── Activation Functions ─────────────────────────────────────────────────────

export interface ActivationResult {
  schedules: string[];
  triggers: string[];
  message: string;
}

/**
 * Activates all preset schedules by loading them into the TriggerEngine.
 * Safe to call multiple times — uses fixed IDs so no duplicates are created.
 */
export function activatePresetSchedules(): ActivationResult {
  const engine = getTriggerEngine();
  const keys = Object.keys(PRESET_SCHEDULES);
  engine.loadSchedules(Object.values(PRESET_SCHEDULES));
  return {
    schedules: keys,
    triggers: [],
    message: `Loaded ${keys.length} preset schedules: ${keys.join(', ')}`,
  };
}

/**
 * Activates all preset triggers by loading them into the TriggerEngine.
 * Safe to call multiple times — uses fixed IDs so no duplicates are created.
 */
export function activatePresetTriggers(): ActivationResult {
  const engine = getTriggerEngine();
  const keys = Object.keys(PRESET_TRIGGERS);
  engine.loadTriggers(Object.values(PRESET_TRIGGERS));
  return {
    schedules: [],
    triggers: keys,
    message: `Loaded ${keys.length} preset triggers: ${keys.join(', ')}`,
  };
}

/**
 * Activates ALL presets (schedules + triggers) in one call.
 * Recommended entry point for initializing the automation layer.
 */
export function activateAllPresets(): ActivationResult {
  const engine = getTriggerEngine();
  const scheduleKeys = Object.keys(PRESET_SCHEDULES);
  const triggerKeys = Object.keys(PRESET_TRIGGERS);
  engine.loadSchedules(Object.values(PRESET_SCHEDULES));
  engine.loadTriggers(Object.values(PRESET_TRIGGERS));
  return {
    schedules: scheduleKeys,
    triggers: triggerKeys,
    message: `All presets activated. ${scheduleKeys.length} schedules + ${triggerKeys.length} triggers loaded. CEO automation layer is live.`,
  };
}
