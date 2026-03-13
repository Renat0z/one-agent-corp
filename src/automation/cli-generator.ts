// One Agent Corp — CLI Generator
// Domain D-8: Translates AutoActions, Schedules, and Pipelines into executable CLI strings

import type { AutoAction, CLICommand, Schedule, AutoPipeline, Trigger } from './types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Escapes a string for safe embedding inside double-quoted shell arguments */
function escapePrompt(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/** Wraps a value with surrounding double-quotes after escaping */
function q(s: string): string {
  return `"${escapePrompt(s)}"`;
}

/** Formats a DepartmentId array as a readable string for prompts */
function deptList(to: string | string[]): string {
  return Array.isArray(to) ? to.join(', ') : to;
}

// ─── generateCLICommand ───────────────────────────────────────────────────────

/**
 * Converts an AutoAction into a ready-to-run CLICommand object.
 * No side-effects — purely generates command strings.
 * 
 * Implements Context Manager principles:
 * 1. Minimal Context (Role-based atomic modules)
 * 2. Token Optimization (Concise prompting)
 * 3. Multi-Agent Role Definition (Summarizer/Executor/CEO)
 */
export function generateCLICommand(action: AutoAction): CLICommand {
  switch (action.type) {
    case 'claude_cli': {
      const prompt = action.prompt ?? '';
      // Context Factory: Lean Strategy
      const contextPack = `[Role: Summarizer & Executor] Task: ${prompt}. Action: Navigate to project root, execute required commands, summarize result. Output concise text only.`;
      const cmd = `pi -p ${q(contextPack)}`;
      return {
        command: cmd,
        description: `Execute pi (MAS Optimized): ${prompt.slice(0, 80)}${prompt.length > 80 ? '...' : ''}`,
        maxTurns: 10,
        cron: action.cron, 
      };
    }

    case 'send_directive': {
      const d = action.directive;
      if (!d) {
        return {
          command: `pi -p "[Role: CEO Agent] Target: all. Action: Broadcast status update."`,
          description: 'Send automated directive (no directive payload provided)',
          cron: action.cron,
        };
      }
      const to = deptList(d.to);
      const deadlineClause = d.deadline ? `, deadline: '${d.deadline}'` : '';
      // Context Factory: Persona + Task + Domain
      const contextPack =
        `[Role: CEO Agent] Target: [${to}]. Action: Execute directive '${d.action}' with objective '${d.objective}'${deadlineClause}. ` +
        `Context: Import getCEOAgent, call ceo.execute({ kind: 'broadcast', action: '${d.action}', objective: '${d.objective}'${deadlineClause}, targetDepartments: [${Array.isArray(d.to) ? d.to.map((x) => `'${x}'`).join(', ') : `'${d.to}'`}] }).`;
      return {
        command: `pi -p ${q(contextPack)}`,
        description: `Send directive to [${to}]: ${d.action} — ${d.objective}`,
        flags: ['--allowedTools', 'Read,Write,Bash'],
        maxTurns: 15,
        cron: action.cron,
      };
    }

    case 'send_report': {
      const contextPack =
        `[Role: Data Aggregator] Action: Collect department reports and CEO status. ` +
        `Context: Navigate to one-agent-corp. For each active department, call department.sendReport(). ` +
        `Final step: call getCEOAgent().execute({ kind: 'status', scope: 'all', includeKpis: true }).`;
      return {
        command: `pi -p ${q(contextPack)}`,
        description: 'Generate automated status report across all departments',
        flags: ['--allowedTools', 'Read,Bash'],
        maxTurns: 20,
        cron: action.cron,
      };
    }

    case 'create_cycle': {
      const ct = action.cycleTemplate;
      if (!ct) {
        return {
          command: `pi -p "[Role: Product Strategist] Action: Initialize new experimentation cycle."`,
          description: 'Create a cycle (no template provided)',
          cron: action.cron,
        };
      }
      const ice = ct.iceScore;
      // Context Factory: Persona + Task + Output Schema
      const contextPack =
        `[Role: Product Strategist] Action: Create cycle '${ct.hypothesis}'. ` +
        `Context: Import getCEOAgent, call ceo.execute({ kind: 'create-cycle', projectId: 'auto-${Date.now()}', ` +
        `hypothesis: '${ct.hypothesis}', minimumTest: '${ct.minimumTest}', ` +
        `targetMetric: '${ct.targetMetric}', targetValue: ${ct.targetValue}, ` +
        `department: '${ct.department}', estimatedDuration: '${ct.estimatedDuration}', ` +
        `iceScore: { impact: ${ice.impact}, confidence: ${ice.confidence}, ease: ${ice.ease} } }).`;
      return {
        command: `pi -p ${q(contextPack)}`,
        description: `Create cycle for [${ct.department}]: ${ct.hypothesis.slice(0, 60)}`,
        flags: ['--allowedTools', 'Read,Write,Bash'],
        maxTurns: 10,
        cron: action.cron,
      };
    }

    case 'notify_ceo': {
      const contextPack =
        action.prompt ? `[Role: Reporter] Task: ${action.prompt}` :
        `[Role: Reporter] Action: Display CEO dashboard snapshot. ` +
        `Context: Import getCEOAgent, display getCEOAgent().getDashboard().getFullSnapshot().`;
      return {
        command: `pi -p ${q(contextPack)}`,
        description: 'Notify CEO — display dashboard or custom notification',
        flags: ['--allowedTools', 'Read'],
        maxTurns: 5,
        cron: action.cron,
      };
    }

    case 'run_script': {
      const scriptPath = action.command ?? 'C:/scripts/automation.ps1';
      const isPs = scriptPath.endsWith('.ps1');
      const runner = isPs ? `powershell -ExecutionPolicy Bypass -File "${scriptPath}"` : `"${scriptPath}"`;
      return {
        command: runner,
        description: `Run script: ${scriptPath}`,
      };
    }

    default: {
      return {
        command: `pi -p "Execute automation action."`,
        description: 'Generic automation action',
      };
    }
  }
}

// ─── generateSchedulerCommand ─────────────────────────────────────────────────

/**
 * Generates a Windows Task Scheduler `schtasks /Create` command for a Schedule.
 * The generated task runs the equivalent `pi -p` command on the cron cadence.
 *
 * Note: schtasks does not support full cron syntax; this generates a best-effort
 * mapping for common patterns. Complex cron expressions are noted in comments.
 */
export function generateSchedulerCommand(schedule: Schedule): string {
  // Inject cron into action for CLI persistence
  schedule.action.cron = schedule.cron;
  const cliCmd = generateCLICommand(schedule.action);
  const taskName = `OneAgentCorp_${schedule.name.replace(/\s+/g, '_')}`;

  // Parse cron to schtasks schedule type (best-effort for common patterns)
  const cronParts = schedule.cron.split(' ');
  let scheduleType = 'DAILY';
  let startTime = '09:00';
  let modifier = '';

  if (cronParts.length >= 5) {
    const [minute, hour, , , dayOfWeek] = cronParts;
    const h = parseInt(hour, 10);
    const m = parseInt(minute, 10);
    if (!isNaN(h) && !isNaN(m)) {
      startTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
    // Mon-Fri pattern "1-5"
    if (dayOfWeek === '1-5') {
      scheduleType = 'WEEKLY';
      modifier = '/D MON,TUE,WED,THU,FRI ';
    } else if (dayOfWeek === '5') {
      scheduleType = 'WEEKLY';
      modifier = '/D FRI ';
    } else if (dayOfWeek === '1') {
      scheduleType = 'WEEKLY';
      modifier = '/D MON ';
    }
  }

  const taskCmd = cliCmd.command.replace(/"/g, '\\"');

  const lines = [
    `:: Task Scheduler command for schedule: ${schedule.name}`,
    `:: Cron: ${schedule.cron} | Timezone: ${schedule.timezone}`,
    `:: Schedule ID: ${schedule.id}`,
    `schtasks /Create /TN "${taskName}" /TR "${taskCmd}" /SC ${scheduleType} ${modifier}/ST ${startTime} /F`,
  ];

  return lines.join('\n');
}

// ─── generateBatchScript ──────────────────────────────────────────────────────

/**
 * Generates a Windows .bat script that chains all pipeline steps via `&&`.
 * Each step runs its CLI command; `continueOnError` steps use `;` instead of `&&`.
 */
export function generateBatchScript(pipeline: AutoPipeline): string {
  const lines: string[] = [
    `@echo off`,
    `:: One Agent Corp — Automation Pipeline: ${pipeline.name}`,
    `:: Pipeline ID: ${pipeline.id}`,
    `:: ${pipeline.description}`,
    `:: Generated: ${new Date().toISOString()}`,
    ``,
    `echo [Pipeline] Starting: ${pipeline.name}`,
    `echo.`,
  ];

  const sortedSteps = [...pipeline.steps].sort((a, b) => a.order - b.order);

  for (let i = 0; i < sortedSteps.length; i++) {
    const step = sortedSteps[i];
    const cliCmd = generateCLICommand(step.action);
    const isLast = i === sortedSteps.length - 1;
    const connector = step.continueOnError ? '' : isLast ? '' : ' ^';

    lines.push(`:: Step ${step.order}: ${step.name}`);
    lines.push(`echo [Step ${step.order}/${sortedSteps.length}] ${step.name}`);
    lines.push(cliCmd.command + connector);

    if (!step.continueOnError && !isLast) {
      lines.push(`if %ERRORLEVEL% neq 0 (`);
      lines.push(`  echo [ERROR] Step ${step.order} failed. Aborting pipeline.`);
      lines.push(`  exit /b %ERRORLEVEL%`);
      lines.push(`)`);
    }

    lines.push(`echo [Step ${step.order}] Done.`);
    lines.push(`echo.`);
  }

  lines.push(`echo [Pipeline] Completed: ${pipeline.name}`);
  lines.push(`exit /b 0`);

  return lines.join('\n');
}

// ─── generateWatchdog ─────────────────────────────────────────────────────────

/**
 * Generates a PowerShell monitoring script that polls for a trigger condition
 * and executes the trigger's action when detected.
 *
 * The watchdog runs in a loop with a configurable sleep interval.
 * It does NOT execute commands — it echoes them so the operator can review first.
 */
export function generateWatchdog(trigger: Trigger): string {
  const cliCmd = generateCLICommand(trigger.action);
  const cooldownSec = Math.floor((trigger.cooldownMs ?? 60000) / 1000);

  const eventDescription = describeEvent(trigger.event);

  const lines: string[] = [
    `# One Agent Corp — Watchdog Script`,
    `# Trigger: ${trigger.name}`,
    `# Trigger ID: ${trigger.id}`,
    `# Event: ${eventDescription}`,
    `# ${trigger.description}`,
    `# Generated: ${new Date().toISOString()}`,
    ``,
    `$TriggerName = "${trigger.name}"`,
    `$CooldownSeconds = ${cooldownSec}`,
    `$MaxFires = ${trigger.maxFires !== undefined ? trigger.maxFires : '[unlimited]'}`,
    `$FireCount = 0`,
    `$LastFiredAt = $null`,
    ``,
    `Write-Host "[Watchdog] Starting monitor for: $TriggerName"`,
    `Write-Host "[Watchdog] Cooldown: ${cooldownSec}s | MaxFires: ${trigger.maxFires ?? 'unlimited'}"`,
    ``,
    `function Invoke-TriggerAction {`,
    `  Write-Host "[Watchdog] TRIGGER FIRED at $(Get-Date -Format 'o')"`,
    `  Write-Host "[Watchdog] Executing action: ${trigger.action.type}"`,
    `  Write-Host "[Watchdog] Command:"`,
    `  Write-Host "  ${cliCmd.command.replace(/"/g, '`"')}"`,
    `  # Uncomment the line below to auto-execute (review first):`,
    `  # Invoke-Expression "${cliCmd.command.replace(/"/g, '`"')}"`,
    `}`,
    ``,
    `while ($true) {`,
    `  $Now = Get-Date`,
    ``,
    `  # Check cooldown`,
    `  if ($LastFiredAt -ne $null) {`,
    `    $Elapsed = ($Now - $LastFiredAt).TotalSeconds`,
    `    if ($Elapsed -lt $CooldownSeconds) {`,
    `      $Remaining = [math]::Ceiling($CooldownSeconds - $Elapsed)`,
    `      Write-Host "[Watchdog] In cooldown. Next check in ${cooldownSec}s. Cooling down: $Remaining"s remaining."`,
    `      Start-Sleep -Seconds $CooldownSeconds`,
    `      continue`,
    `    }`,
    `  }`,
    ``,
    `  # MaxFires guard`,
    `  ${trigger.maxFires !== undefined ? `if ($FireCount -ge ${trigger.maxFires}) { Write-Host "[Watchdog] MaxFires (${trigger.maxFires}) reached. Exiting."; break }` : '# No maxFires limit'}`,
    ``,
    `  # TODO: Replace this stub with real condition check for event: ${eventDescription}`,
    `  $ConditionMet = $false  # Implement your detection logic here`,
    ``,
    `  if ($ConditionMet) {`,
    `    Invoke-TriggerAction`,
    `    $FireCount++`,
    `    $LastFiredAt = $Now`,
    `    Write-Host "[Watchdog] Fire #$FireCount recorded."`,
    `  } else {`,
    `    Write-Host "[Watchdog] Condition not met at $($Now.ToString('HH:mm:ss')). Waiting..."`,
    `  }`,
    ``,
    `  Start-Sleep -Seconds ${cooldownSec}`,
    `}`,
    ``,
    `Write-Host "[Watchdog] Monitor stopped."`,
  ];

  return lines.join('\n');
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function describeEvent(event: import('./types').TriggerEvent): string {
  switch (event.type) {
    case 'cycle_completed':
      return `cycle_completed${event.projectId ? ` (project: ${event.projectId})` : ''}${event.department ? ` (dept: ${event.department})` : ''}`;
    case 'cycle_result_ready':
      return `cycle_result_ready${event.projectId ? ` (project: ${event.projectId})` : ''}`;
    case 'escalation_received':
      return `escalation_received${event.severity ? ` severity:${event.severity}` : ''}`;
    case 'gate_pending':
      return `gate_pending${event.projectId ? ` (project: ${event.projectId})` : ''}`;
    case 'kpi_breach':
      return `kpi_breach${event.department ? ` dept:${event.department}` : ''}${event.kpiId ? ` kpi:${event.kpiId}` : ''}`;
    case 'message_received':
      return `message_received${event.messageType ? ` type:${event.messageType}` : ''}${event.from ? ` from:${event.from}` : ''}`;
    case 'schedule':
      return `schedule cron:"${event.cron}"`;
    case 'pipeline_stage_complete':
      return `pipeline_stage_complete${event.stage ? ` stage:${event.stage}` : ''}`;
    case 'velocity_drop':
      return `velocity_drop${event.threshold !== undefined ? ` threshold:<${event.threshold}` : ''}`;
    default:
      return 'unknown_event';
  }
}
