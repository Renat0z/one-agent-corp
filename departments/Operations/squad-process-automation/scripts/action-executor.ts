/**
 * action-executor.ts
 * Department of Flow Intelligence — Executor de Ações
 * Swarm OS v4.2
 *
 * Lê approved-actions.json, resolve a ordem de dependências
 * via topological sort (Kahn's algorithm) e executa cada
 * script em sequência, respeitando a cadeia de dependências.
 *
 * Uso: npx tsx scripts/action-executor.ts --project={projectId} [--dry-run]
 */

import * as fs   from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { execa }         from "execa";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ─── Config ──────────────────────────────────────────────────────────────────

const cliArgs    = process.argv.slice(2);
const projectArg = cliArgs.find((a) => a.startsWith("--project="));
const PROJECT_ID = projectArg ? projectArg.split("=")[1] : "one-agent-corp";
const DRY_RUN    = cliArgs.includes("--dry-run");
const RESET_CTX  = cliArgs.includes("--reset-context");

const ROOT      = path.resolve(__dirname, "..");
const WORKSPACE = path.join(ROOT, "workspace", PROJECT_ID === "one-agent-corp" ? "" : PROJECT_ID);
const FLOW_DIR  = path.join(WORKSPACE, "flow");
const MANUAL_DIR = path.join(FLOW_DIR, "manual-tasks");
const STATE_FILE = path.join(FLOW_DIR, "execution-state.json");

// ─── Stuck Detection ──────────────────────────────────────────────────────────

interface ExecutionState {
  attempts: Record<string, number>;
  last_failed_id: string | null;
}

function loadState(): ExecutionState {
  if (fs.existsSync(STATE_FILE)) {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
  }
  return { attempts: {}, last_failed_id: null };
}

function saveState(state: ExecutionState) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf-8");
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface AcidFields {
  action:    string;
  context:   string;
  indicator: string;
  deadline:  string;
}

interface ApprovedAction {
  id:               string;
  rank:             number;
  bottleneck:       string;
  ice_score:        number;
  type:             string;
  root_cause:       string;
  status:           "approved" | "rejected" | "amended" | "pending";
  acid:             AcidFields;
  script:           string | null;
  script_args:      string[];
  dependencies:     string[];
  amendment_reason?: string;
}

interface ApprovedPlan {
  version:             string;
  project:             string;
  reviewed_at:         string;
  status:              string;
  consensus:           string;
  board_synthesis:     string;
  critical_constraint: string;
  actions:             ApprovedAction[];
}

interface ExecutionResult {
  id:         string;
  script:     string | null;
  status:     "success" | "failed" | "skipped" | "manual";
  exit_code:  number | null;
  started_at: string;
  ended_at:   string;
  error?:     string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readJson<T>(p: string): T | null {
  try { return JSON.parse(fs.readFileSync(p, "utf-8")) as T; }
  catch { return null; }
}

function ensureDir(d: string) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

function ts() { return new Date().toISOString(); }

function banner(text: string, width = 52) {
  const pad = Math.max(0, width - text.length - 4);
  const l   = Math.floor(pad / 2);
  const r   = pad - l;
  console.log(`║ ${" ".repeat(l)}${text}${" ".repeat(r)} ║`);
}

// ─── Topological Sort (Kahn's Algorithm) ─────────────────────────────────────

function topoSort(actions: ApprovedAction[]): ApprovedAction[] {
  const idMap   = new Map<string, ApprovedAction>(actions.map((a) => [a.id, a]));
  const inDegree = new Map<string, number>(actions.map((a) => [a.id, 0]));
  const adj      = new Map<string, string[]>(actions.map((a) => [a.id, []]));

  // Build adjacency list and in-degree map
  for (const action of actions) {
    for (const dep of action.dependencies) {
      if (idMap.has(dep)) {
        adj.get(dep)!.push(action.id);
        inDegree.set(action.id, (inDegree.get(action.id) || 0) + 1);
      }
    }
  }

  // Kahn's BFS
  const queue:  ApprovedAction[] = [];
  const result: ApprovedAction[] = [];

  // Seed: all nodes with in-degree 0 (sorted by rank for determinism)
  const zeroIn = actions
    .filter((a) => (inDegree.get(a.id) || 0) === 0)
    .sort((a, b) => a.rank - b.rank);
  queue.push(...zeroIn);

  while (queue.length > 0) {
    const node = queue.shift()!;
    result.push(node);

    const neighbors = (adj.get(node.id) || [])
      .map((nid) => idMap.get(nid)!)
      .filter(Boolean);

    for (const neighbor of neighbors) {
      const newDeg = (inDegree.get(neighbor.id) || 1) - 1;
      inDegree.set(neighbor.id, newDeg);
      if (newDeg === 0) {
        // Insert in rank order
        const insertAt = queue.findIndex((q) => q.rank > neighbor.rank);
        if (insertAt === -1) queue.push(neighbor);
        else queue.splice(insertAt, 0, neighbor);
      }
    }
  }

  // Cycle detection
  if (result.length !== actions.length) {
    console.warn("⚠️  Ciclo detectado no grafo de dependências — executando por rank.");
    return [...actions].sort((a, b) => a.rank - b.rank);
  }

  return result;
}

// ─── Script Runner ────────────────────────────────────────────────────────────

async function runScript(
  action: ApprovedAction
): Promise<ExecutionResult> {
  const started_at = ts();

  if (!action.script) {
    // Manual action — save to manual-tasks/ and skip
    ensureDir(MANUAL_DIR);
    const taskFile = path.join(MANUAL_DIR, `${action.id}.json`);
    fs.writeFileSync(taskFile, JSON.stringify({
      id:        action.id,
      rank:      action.rank,
      type:      action.type,
      acid:      action.acid,
      status:    "pending_manual",
      created_at: started_at,
    }, null, 2), "utf-8");

    console.log(`\n  📝 AÇÃO MANUAL: ${action.id}`);
    console.log(`     Ação:      ${action.acid.action}`);
    console.log(`     Contexto:  ${action.acid.context}`);
    console.log(`     Indicador: ${action.acid.indicator}`);
    console.log(`     Arquivo:   flow/manual-tasks/${action.id}.json`);

    return { id: action.id, script: null, status: "manual", exit_code: null, started_at, ended_at: ts() };
  }

  const scriptPath = path.resolve(ROOT, action.script);
  const displayScript = `npx tsx ${action.script} ${action.script_args.join(" ")}`;

  console.log(`\n  ▶  Executando: ${displayScript}`);

  if (DRY_RUN) {
    console.log(`     [DRY-RUN] Pulando execução real.`);
    return { id: action.id, script: action.script, status: "skipped", exit_code: 0, started_at, ended_at: ts() };
  }

  if (!fs.existsSync(scriptPath)) {
    const errMsg = `Script não encontrado: ${scriptPath}`;
    console.error(`     ❌ ${errMsg}`);
    return { id: action.id, script: action.script, status: "failed", exit_code: 1, started_at, ended_at: ts(), error: errMsg };
  }

  try {
    await execa("npx", ["tsx", action.script, ...action.script_args], {
      cwd:   ROOT,
      stdio: "inherit",
    });
    console.log(`\n  ✅ ${action.id} — concluído com sucesso`);
    return { id: action.id, script: action.script, status: "success", exit_code: 0, started_at, ended_at: ts() };
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    console.error(`\n  ❌ ${action.id} — falhou: ${errMsg}`);
    return { id: action.id, script: action.script, status: "failed", exit_code: err?.exitCode || 1, started_at, ended_at: ts(), error: errMsg };
  }
}

// ─── Report Writer ────────────────────────────────────────────────────────────

function writeExecutionReport(
  plan:    ApprovedPlan,
  sorted:  ApprovedAction[],
  results: ExecutionResult[]
) {
  ensureDir(FLOW_DIR);

  const resultMap = new Map(results.map((r) => [r.id, r]));

  const report = {
    version:        "1.0",
    project:        PROJECT_ID,
    executed_at:    ts(),
    dry_run:        DRY_RUN,
    plan_consensus: plan.consensus,
    execution_order: sorted.map((a) => a.id),
    summary: {
      total:   results.length,
      success: results.filter((r) => r.status === "success").length,
      failed:  results.filter((r) => r.status === "failed").length,
      skipped: results.filter((r) => r.status === "skipped").length,
      manual:  results.filter((r) => r.status === "manual").length,
    },
    results: sorted.map((a) => {
      const r = resultMap.get(a.id);
      return {
        id:          a.id,
        rank:        a.rank,
        bottleneck:  a.bottleneck,
        type:        a.type,
        script:      a.script,
        status:      r?.status      || "not_run",
        exit_code:   r?.exit_code   ?? null,
        started_at:  r?.started_at  || null,
        ended_at:    r?.ended_at    || null,
        error:       r?.error       || null,
        acid_action: a.acid.action,
      };
    }),
  };

  const reportPath = path.join(FLOW_DIR, "execution-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf-8");
  console.log(`\n  📋 execution-report.json → ${reportPath}`);
  return report;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const W = 52;
  console.log("╔" + "═".repeat(W) + "╗");
  banner("Action Executor — Swarm OS v4.2");
  banner("Execução automática de ações aprovadas");
  console.log("╚" + "═".repeat(W) + "╝");
  console.log(`\n🎯 Projeto: ${PROJECT_ID}${DRY_RUN ? " [DRY-RUN]" : ""}`);

  // 1. Ler approved-actions.json
  const approvedPath = path.join(FLOW_DIR, "approved-actions.json");
  if (!fs.existsSync(approvedPath)) {
    console.error(`\n❌ approved-actions.json não encontrado em: ${approvedPath}`);
    console.error("   Execute primeiro: npx tsx scripts/strategy-review.ts");
    process.exit(1);
  }

  const plan = readJson<ApprovedPlan>(approvedPath);
  if (!plan) {
    console.error("❌ Erro ao parsear approved-actions.json");
    process.exit(1);
  }

  console.log(`\n  ✓ approved-actions.json carregado`);
  console.log(`  ✓ Consensus: ${plan.consensus?.toUpperCase()}`);
  console.log(`  ✓ ${plan.actions?.length || 0} ações no plano`);

  // 2. Filtrar: apenas approved + amended (não rejected)
  const executable = plan.actions.filter(
    (a) => a.status === "approved" || a.status === "amended"
  );

  if (executable.length === 0) {
    console.warn("\n⚠️  Nenhuma ação aprovada para executar.");
    process.exit(0);
  }

  console.log(`  ✓ ${executable.length} ações aprovadas para execução`);

  // 3. Topological Sort
  console.log("\n🔗 [Executor] Resolvendo ordem de dependências...");
  const sorted = topoSort(executable);
  console.log(`\n  Ordem de execução:`);
  sorted.forEach((a, i) => {
    const scriptDisplay = a.script ? `→ ${a.script}` : "→ [MANUAL]";
    console.log(`  ${i + 1}. [${a.id}] ${a.bottleneck.substring(0, 45)}... ${scriptDisplay}`);
  });

  // 4. Executar cada ação em ordem
  console.log("\n⚡ [Executor] Iniciando execução...");
  console.log("═".repeat(54));

  const results: ExecutionResult[] = [];
  let failedCount = 0;
  const state = loadState();

  for (const action of sorted) {
    const attempts = state.attempts[action.id] || 0;
    if (attempts >= 2) {
       console.error(`\n🚫 STUCK DETECTED: Ação ${action.id} falhou ${attempts} vezes.`);
       console.error(`   Acionando Department of Flow Intelligence para análise manual.`);
       break;
    }

    console.log(`\n┌─ [${action.id}] Rank #${action.rank} — ICE: ${action.ice_score}`);
    console.log(`│  Gargalo: ${action.bottleneck}`);
    console.log(`│  Tipo:    ${action.type}`);
    console.log(`│  Ação:    ${action.acid.action.substring(0, 70)}...`);
    if (RESET_CTX) {
       console.log(`│  [RESET_CTX] Reinicializando contexto para esta tarefa.`);
    }
    console.log(`└${"─".repeat(52)}`);

    const result = await runScript(action);
    results.push(result);

    if (result.status === "failed") {
      failedCount++;
      state.attempts[action.id] = attempts + 1;
      state.last_failed_id = action.id;
      saveState(state);
      console.error(`\n  ⚠️  Falha na ação ${action.id}. Continuando com as próximas...`);
    } else if (result.status === "success") {
      // Clear attempts on success
      delete state.attempts[action.id];
      saveState(state);
    }
  }

  // 5. Relatório de execução
  console.log("\n💾 [Executor] Escrevendo relatório de execução...");
  const report = writeExecutionReport(plan, sorted, results);

  // 6. Sumário final
  console.log("\n╔" + "═".repeat(W) + "╗");
  banner("✅ Execução Concluída");
  console.log("╚" + "═".repeat(W) + "╝");
  console.log(`\n  Total:    ${report.summary.total}`);
  console.log(`  ✅ Sucesso: ${report.summary.success}`);
  console.log(`  ❌ Falhas:  ${report.summary.failed}`);
  console.log(`  📝 Manual: ${report.summary.manual}`);
  console.log(`  ⏭️  Puladas: ${report.summary.skipped}`);

  if (report.summary.manual > 0) {
    console.log(`\n  📁 Tarefas manuais em: flow/manual-tasks/`);
  }

  if (failedCount > 0) {
    console.error(`\n  ⚠️  ${failedCount} ação(ões) falharam. Verifique execution-report.json.`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("❌ Erro no Action Executor:", e);
  process.exit(1);
});
