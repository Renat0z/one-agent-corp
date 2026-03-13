// One Agent Corp — CEO Real Execution Commands
// Domain D-4: New command kinds for real factory operation — department runs, deployments, artifacts

// ─── Real Command Kinds ───────────────────────────────────────────────────────

export type RealCEOCommandKind =
  | 'run-department'   // Execute a specific department with a prompt
  | 'deploy-project'   // Deploy a project to VPS
  | 'check-artifacts'  // Check what artifacts exist for a project
  | 'self-improve'     // Trigger self-improvement loop for a department
  | 'stream-output';   // Stream real-time output from a department run

// ─── Command Interfaces ───────────────────────────────────────────────────────

export interface RunDepartmentCommand {
  kind: 'run-department';
  department: string;  // e.g. 'engineering', 'design', 'growth'
  projectId: string;
  task: string;        // what to generate (free-form prompt for the department)
  model?: string;      // claude model to use (defaults to 'claude-sonnet-4-6')
}

export interface DeployProjectCommand {
  kind: 'deploy-project';
  projectId: string;
  environment: 'staging' | 'production';
}

export interface CheckArtifactsCommand {
  kind: 'check-artifacts';
  projectId: string;
}

export interface SelfImproveCommand {
  kind: 'self-improve';
  department: string;  // department to run self-improvement loop on
}

export interface StreamOutputCommand {
  kind: 'stream-output';
  department: string;
  projectId: string;
  prompt: string;
}

// ─── Union Type ───────────────────────────────────────────────────────────────

export type RealCEOCommand =
  | RunDepartmentCommand
  | DeployProjectCommand
  | CheckArtifactsCommand
  | SelfImproveCommand
  | StreamOutputCommand;

// ─── Real Command Result ──────────────────────────────────────────────────────

export interface RealCommandResult {
  kind: RealCEOCommandKind;
  status: 'executed' | 'queued' | 'error';
  timestamp: string;
  output: string;
  projectId?: string;
  department?: string;
  metadata?: Record<string, unknown>;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

/**
 * Handles real CEO commands for factory operation.
 *
 * Current implementation: stub handlers that log intent and return descriptive strings.
 * Real execution will be wired when D-2 (department agents) and D-3 (orchestrator) are complete.
 *
 * Each handler documents the real wiring point so integration is straightforward.
 */
export async function handleRealCommand(cmd: RealCEOCommand): Promise<string> {
  const timestamp = new Date().toISOString();

  switch (cmd.kind) {
    case 'run-department':
      return handleRunDepartment(cmd, timestamp);

    case 'deploy-project':
      return handleDeployProject(cmd, timestamp);

    case 'check-artifacts':
      return handleCheckArtifacts(cmd, timestamp);

    case 'self-improve':
      return handleSelfImprove(cmd, timestamp);

    case 'stream-output':
      return handleStreamOutput(cmd, timestamp);

    default: {
      const exhaustiveCheck: never = cmd;
      return `[RealCEOCommand] Unknown command kind: ${(exhaustiveCheck as RealCEOCommand).kind}`;
    }
  }
}

// ─── Individual Handlers ──────────────────────────────────────────────────────

async function handleRunDepartment(
  cmd: RunDepartmentCommand,
  timestamp: string
): Promise<string> {
  const model = cmd.model ?? 'claude-sonnet-4-6';

  // Real wiring point:
  // - Look up department agent from D-2 registry
  // - Call agent.executeTask({ projectId: cmd.projectId, task: cmd.task, model })
  // - Return streamed output or artifact path

  console.log(
    `[RealCEOCommand][run-department] ${timestamp} — department='${cmd.department}' ` +
    `project='${cmd.projectId}' model='${model}'`
  );
  console.log(`[RealCEOCommand][run-department] task: ${cmd.task}`);
  console.log(
    `[RealCEOCommand][run-department] NOTE: real department execution will be wired ` +
    `when D-2 department agents are connected. Stub response returned.`
  );

  return [
    `[run-department] STUB RESPONSE`,
    `Department: ${cmd.department}`,
    `Project: ${cmd.projectId}`,
    `Model: ${model}`,
    `Task: ${cmd.task}`,
    `Status: queued — real execution pending D-2 wiring`,
    `Timestamp: ${timestamp}`,
    `Expected output: department artifact (code, report, or analysis) saved to dist/artifacts/${cmd.projectId}/${cmd.department}/`,
  ].join('\n');
}

async function handleDeployProject(
  cmd: DeployProjectCommand,
  timestamp: string
): Promise<string> {
  // Real wiring point:
  // - Load deploy manifest from dist/artifacts/${cmd.projectId}/
  // - Call OperationsAgent.deployToVPS({ projectId, environment })
  // - Tail deployment logs and return status

  const targetHost =
    cmd.environment === 'production' ? 'vps-prod.oneagentcorp.io' : 'vps-staging.oneagentcorp.io';

  console.log(
    `[RealCEOCommand][deploy-project] ${timestamp} — project='${cmd.projectId}' ` +
    `environment='${cmd.environment}' target='${targetHost}'`
  );
  console.log(
    `[RealCEOCommand][deploy-project] NOTE: real VPS deployment will be wired ` +
    `when Operations department agent is connected. Stub response returned.`
  );

  return [
    `[deploy-project] STUB RESPONSE`,
    `Project: ${cmd.projectId}`,
    `Environment: ${cmd.environment}`,
    `Target host: ${targetHost}`,
    `Status: queued — real deployment pending Operations agent (D-2) wiring`,
    `Timestamp: ${timestamp}`,
    `Expected steps:`,
    `  1. Bundle artifacts from dist/artifacts/${cmd.projectId}/`,
    `  2. SSH to ${targetHost}`,
    `  3. docker-compose up -d`,
    `  4. Health check: GET /health — expect 200`,
    `  5. Update DNS CNAME: ${cmd.projectId}.oneagentcorp.io`,
  ].join('\n');
}

async function handleCheckArtifacts(
  cmd: CheckArtifactsCommand,
  timestamp: string
): Promise<string> {
  // Real wiring point:
  // - Scan dist/artifacts/${cmd.projectId}/ directory
  // - Return manifest of files: type, size, created_at, department owner

  console.log(
    `[RealCEOCommand][check-artifacts] ${timestamp} — project='${cmd.projectId}'`
  );
  console.log(
    `[RealCEOCommand][check-artifacts] NOTE: real artifact scanning will be wired ` +
    `when artifact store is implemented. Stub response returned.`
  );

  return [
    `[check-artifacts] STUB RESPONSE`,
    `Project: ${cmd.projectId}`,
    `Artifact directory: dist/artifacts/${cmd.projectId}/`,
    `Status: no artifacts found — real scanning pending artifact store wiring`,
    `Timestamp: ${timestamp}`,
    `Expected artifact types by department:`,
    `  engineering/  → source code, package.json, Dockerfile`,
    `  design/       → Figma exports, CSS, component library`,
    `  growth/       → landing page copy, email sequences, ad creatives`,
    `  data/         → analytics dashboards, experiment results`,
    `  operations/   → docker-compose.yml, nginx.conf, deploy scripts`,
  ].join('\n');
}

async function handleSelfImprove(
  cmd: SelfImproveCommand,
  timestamp: string
): Promise<string> {
  // Real wiring point:
  // - Load department's last 5 execution results from artifact store
  // - Call department agent's self-critique loop (model reviews own output)
  // - Generate improvement prompt and store in department memory
  // - Return improvement delta summary

  console.log(
    `[RealCEOCommand][self-improve] ${timestamp} — department='${cmd.department}'`
  );
  console.log(
    `[RealCEOCommand][self-improve] NOTE: real self-improvement loop will be wired ` +
    `when department memory store is implemented. Stub response returned.`
  );

  return [
    `[self-improve] STUB RESPONSE`,
    `Department: ${cmd.department}`,
    `Status: queued — real self-improvement loop pending department memory store`,
    `Timestamp: ${timestamp}`,
    `Expected self-improvement loop:`,
    `  1. Load last 5 execution results for ${cmd.department}`,
    `  2. Model critiques its own outputs: what worked, what failed`,
    `  3. Generate updated system prompt with learned heuristics`,
    `  4. A/B test new prompt vs old on next 3 tasks`,
    `  5. Persist winning prompt to .claude/memory/${cmd.department}-learned.md`,
  ].join('\n');
}

async function handleStreamOutput(
  cmd: StreamOutputCommand,
  timestamp: string
): Promise<string> {
  // Real wiring point:
  // - Spawn department agent subprocess with cmd.prompt
  // - Stream stdout via EventEmitter or ReadableStream
  // - Return stream handle or accumulated output on completion

  console.log(
    `[RealCEOCommand][stream-output] ${timestamp} — department='${cmd.department}' ` +
    `project='${cmd.projectId}'`
  );
  console.log(`[RealCEOCommand][stream-output] prompt: ${cmd.prompt}`);
  console.log(
    `[RealCEOCommand][stream-output] NOTE: real streaming will be wired ` +
    `when department subprocess runner is implemented. Stub response returned.`
  );

  return [
    `[stream-output] STUB RESPONSE`,
    `Department: ${cmd.department}`,
    `Project: ${cmd.projectId}`,
    `Prompt: ${cmd.prompt}`,
    `Status: queued — real streaming pending subprocess runner wiring`,
    `Timestamp: ${timestamp}`,
    `Expected behavior:`,
    `  - Spawn: claude -p "${cmd.prompt}" --department ${cmd.department} --project ${cmd.projectId}`,
    `  - Stream stdout line-by-line to caller`,
    `  - Persist final output to dist/artifacts/${cmd.projectId}/${cmd.department}/stream-${timestamp}.txt`,
  ].join('\n');
}

// ─── Command Builders ─────────────────────────────────────────────────────────

/** Build a run-department command with sensible defaults */
export function buildRunDepartmentCmd(
  department: string,
  projectId: string,
  task: string,
  model?: string
): RunDepartmentCommand {
  return { kind: 'run-department', department, projectId, task, model };
}

/** Build a deploy-project command */
export function buildDeployCmd(
  projectId: string,
  environment: 'staging' | 'production' = 'staging'
): DeployProjectCommand {
  return { kind: 'deploy-project', projectId, environment };
}

/** Build a check-artifacts command */
export function buildCheckArtifactsCmd(projectId: string): CheckArtifactsCommand {
  return { kind: 'check-artifacts', projectId };
}

/** Build a self-improve command */
export function buildSelfImproveCmd(department: string): SelfImproveCommand {
  return { kind: 'self-improve', department };
}

/** Build a stream-output command */
export function buildStreamOutputCmd(
  department: string,
  projectId: string,
  prompt: string
): StreamOutputCommand {
  return { kind: 'stream-output', department, projectId, prompt };
}
