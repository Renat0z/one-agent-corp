/**
 * orchestrator.ts
 * Swarm OS v4.2 — Master Pipeline Orchestrator
 *
 * Executa todos os scripts npx tsx em ordem de dependência.
 * Suporta chains nomeadas e flags de controle.
 *
 * Uso:
 *   npx tsx scripts/orchestrator.ts --chain=flow   --project=one-agent-corp
 *   npx tsx scripts/orchestrator.ts --chain=audit  --project=one-agent-corp
 *   npx tsx scripts/orchestrator.ts --chain=full   --project=one-agent-corp
 *   npx tsx scripts/orchestrator.ts --chain=deploy --project=profitbridge
 *   npx tsx scripts/orchestrator.ts --list                 # mostra todos os scripts e deps
 *
 * Flags:
 *   --chain=<name>    Chain a executar (flow, audit, full, stage0, deploy, cycle)
 *   --project=<id>    ID do projeto (default: one-agent-corp)
 *   --dry-run         Mostra a ordem sem executar
 *   --force           Continua mesmo se um script falhar
 *   --list            Lista todos os scripts registrados
 *   --verbose         Exibe output completo dos scripts filhos (padrão: quiet)
 *                     No modo quiet (padrão): só logs de início, fim, status e artefatos
 */

import * as fs   from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { execa }         from "execa";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const ROOT       = path.resolve(__dirname, "..");

// ─── Types ────────────────────────────────────────────────────────────────────

type ChainName =
  | "flow"     // Flow Intelligence pipeline completo
  | "audit"    // QA + reflexão
  | "full"     // audit + flow
  | "stage0"   // pesquisa de mercado
  | "deploy"   // deploy da infra
  | "cycle"    // ciclo de produto
  | "project"  // lifecycle completo de novo projeto + auditoria final
  | "traction" // aquisição orgânica, outbound e conteúdo
  | "conversion" // funis, lead magnets e otimização de LP
  | "all";     // tudo

interface ScriptNode {
  id:          string;
  script:      string;           // caminho relativo ao ROOT
  description: string;
  dependencies: string[];        // IDs de outros ScriptNodes
  chains:      ChainName[];      // em quais chains este script aparece
  args?:       string[];         // args fixos além do --project
  condition?:  () => boolean;    // executar apenas se condição for true
}

interface RunResult {
  id:         string;
  status:     "success" | "failed" | "skipped" | "dry-run";
  exit_code:  number | null;
  started_at: string;
  ended_at:   string;
  error?:     string;
}

// ─── Parse CLI ────────────────────────────────────────────────────────────────

const cliArgs    = process.argv.slice(2);
const chainArg   = (cliArgs.find((a) => a.startsWith("--chain="))   || "--chain=flow"   ).replace("--chain=",   "");
const projectArg = (cliArgs.find((a) => a.startsWith("--project=")) || "--project=one-agent-corp").replace("--project=", "");
const DRY_RUN    = cliArgs.includes("--dry-run");
const FORCE      = cliArgs.includes("--force");
const LIST_MODE  = cliArgs.includes("--list");
const QUIET      = !cliArgs.includes("--verbose"); // ← quiet é o padrão; use --verbose para output completo
const CHAIN      = (chainArg || "flow") as ChainName;
const PROJECT_ID = projectArg;
const STATUS_MODE = cliArgs.includes("--status");

const WORKSPACE  = path.join(ROOT, "workspace", PROJECT_ID === "one-agent-corp" ? "" : PROJECT_ID);
const FLOW_DIR   = path.join(WORKSPACE, "flow");

// ─── Git Helpers ──────────────────────────────────────────────────────────────

async function gitSafe(args: string[]): Promise<string> {
  try {
    const { stdout } = await execa("git", args, { cwd: ROOT });
    return stdout;
  } catch (err: any) {
    console.warn(`  [GIT] Aviso: ${err.message}`);
    return "";
  }
}

async function prepareBranch(projectId: string) {
  if (projectId === "one-agent-corp") return;
  const branchName = `swarm/${projectId}`;
  console.log(`\n🌿 [GIT] Isolando execução na branch: ${branchName}`);
  
  await gitSafe(["checkout", "-b", branchName]);
  // Se já existir, apenas checkout
  await gitSafe(["checkout", branchName]);
}

async function finalizeBranch(projectId: string, success: boolean) {
  if (projectId === "one-agent-corp") return;
  const branchName = `swarm/${projectId}`;
  
  if (success) {
    console.log(`\n🌿 [GIT] SUCESSO: Fazendo merge de ${branchName} para main...`);
    await gitSafe(["add", "."]);
    await gitSafe(["commit", "-m", `feat(${projectId}): finalização de ciclo swarm`]);
    await gitSafe(["checkout", "main"]);
    await gitSafe(["merge", branchName]);
    await gitSafe(["branch", "-d", branchName]);
  } else {
    console.log(`\n🌿 [GIT] FALHA: Mantendo branch ${branchName} para inspeção.`);
  }
}

// ─── Script Registry ──────────────────────────────────────────────────────────
//
//   REGRA: toda vez que um novo script for criado, registrá-lo aqui.
//   As dependências determinam a ordem de execução.
//   O topological sort (Kahn's) resolve automaticamente.

const REGISTRY: ScriptNode[] = [

  // ── New Project Lifecycle chain ──────────────────────────────────────────

  {
    id:           "project-lifecycle",
    script:       "scripts/project-lifecycle.ts",
    description:  "Full lifecycle: Research→PRD→Arch→Build→QA→Deploy (com gates adaptativos por fase)",
    dependencies: [],
    chains:       ["project", "all"],
  },
  {
    id:           "lifecycle-audit",
    script:       "scripts/lifecycle-audit.ts",
    description:  "Dept. QA & Audit — avalia o fluxo completo e gera melhorias (Dalio·Ellis·Grove)",
    dependencies: ["project-lifecycle"],
    chains:       ["project", "all"],
  },

  // ── Flow Intelligence chain ──────────────────────────────────────────────

  {
    id:           "flow-intelligence",
    script:       "scripts/flow-intelligence.ts",
    description:  "Dept. of Flow Intelligence — mapa de gargalos ICE (Sean Ellis, Mochary, Balfour, Murph)",
    dependencies: [],
    chains:       ["flow", "full", "all"],
  },
  {
    id:           "strategy-review",
    script:       "scripts/strategy-review.ts",
    description:  "Dept. of Strategy — aprovação do plano de ação (Dalio, Goldratt, Porter)",
    dependencies: ["flow-intelligence"],
    chains:       ["flow", "full", "all"],
  },
  {
    id:           "action-executor",
    script:       "scripts/action-executor.ts",
    description:  "Executor — executa ações aprovadas em ordem de dependência",
    dependencies: ["strategy-review"],
    chains:       ["flow", "full", "all"],
  },

  // ── Audit chain ──────────────────────────────────────────────────────────

  {
    id:           "auto-audit",
    script:       "scripts/auto-audit.ts",
    description:  "Dept. QA & Audit — validação de integridade técnica",
    dependencies: [],
    chains:       ["audit", "full", "all"],
  },
  {
    id:           "post-cycle-reflection",
    script:       "scripts/post-cycle-reflection.ts",
    description:  "Dept. QA & Audit — reflexão de ciclo e meta-aprendizado",
    dependencies: ["auto-audit"],
    chains:       ["audit", "full", "all"],
  },
  {
    id:           "cost-tracker",
    script:       "scripts/cost-tracker.ts",
    description:  "Dept. of Flow Intelligence — monitor de custos e tokens",
    dependencies: ["post-cycle-reflection"],
    chains:       ["audit", "full", "all"],
  },

  // ── Stage 0 — Pesquisa ────────────────────────────────────────────────────

  {
    id:           "stage0-research",
    script:       "scripts/stage0-next-project.ts",
    description:  "Stage 0 — Tendências → Red Team → Competitivo → Oferta → Gate 0",
    dependencies: [],
    chains:       ["stage0", "all"],
  },
  {
    id:           "market-scout",
    script:       "scripts/market-scout.ts",
    description:  "Market Scout — análise de mercado e oportunidades",
    dependencies: [],
    chains:       ["stage0", "all"],
  },
  {
    id:           "generate-prd",
    script:       "scripts/generate-prd.ts",
    description:  "Dept. Product — geração do PRD e user stories",
    dependencies: ["stage0-research"],
    chains:       ["stage0", "cycle", "all"],
  },

  // ── Cycle chain ───────────────────────────────────────────────────────────

  {
    id:           "start-cycle1",
    script:       "scripts/start-cycle1.ts",
    description:  "Ciclo 1 — inicialização de pipeline e hipótese de conectividade",
    dependencies: ["generate-prd"],
    chains:       ["cycle", "all"],
  },
  {
    id:           "pipeline-full-run",
    script:       "scripts/pipeline-full-run.ts",
    description:  "Pipeline Full Run — 6 stages (ideation → validation → mvp → launch → growth → scale)",
    dependencies: ["start-cycle1"],
    chains:       ["cycle", "all"],
  },
  {
    id:           "complete-cycle1",
    script:       "scripts/complete-cycle1.ts",
    description:  "Completa Ciclo 1 — fecha estado e extrai resultados",
    dependencies: ["pipeline-full-run"],
    chains:       ["cycle", "all"],
  },
  {
    id:           "advance-to-cycle2",
    script:       "scripts/advance-to-cycle2.ts",
    description:  "Avança para Ciclo 2 — define hipótese seguinte",
    dependencies: ["complete-cycle1"],
    chains:       ["cycle", "all"],
  },
  {
    id:           "consult-council",
    script:       "scripts/consult-council.ts",
    description:  "Council — consulta mentes estratégicas sobre desafios específicos",
    dependencies: ["start-cycle1"],
    chains:       ["cycle", "all"],
  },

  // ── Deploy chain ──────────────────────────────────────────────────────────

  {
    id:           "deploy-profitbridge",
    script:       "scripts/deploy-profitbridge.ts",
    description:  "Deploy ProfitBridge AI — backend + frontend",
    dependencies: ["pipeline-full-run"],
    chains:       ["deploy", "all"],
  },
  {
    id:           "deploy-full-stack",
    script:       "scripts/deploy-full-stack.ts",
    description:  "Deploy Full Stack — infra completa",
    dependencies: ["deploy-profitbridge"],
    chains:       ["deploy", "all"],
  },
  {
    id:           "check-deploy",
    script:       "scripts/check-deploy.ts",
    description:  "Check Deploy — health check pós-deploy",
    dependencies: ["deploy-full-stack"],
    chains:       ["deploy", "all"],
  },
  {
    id:           "launch-ai-report-generator",
    script:       "scripts/launch-ai-report-generator.ts",
    description:  "Launch — inicializa AI Report Generator em produção",
    dependencies: ["check-deploy"],
    chains:       ["deploy", "all"],
  },
  {
    id:           "pipeline-advance-ai-report",
    script:       "scripts/pipeline-advance-ai-report-generator.ts",
    description:  "Pipeline Advance — avança AI Report Generator para próxima fase",
    dependencies: ["launch-ai-report-generator"],
    chains:       ["deploy", "all"],
  },

  // ── Traction & MRR Growth chain ──────────────────────────────────────────

  {
    id:           "prospecting-engine",
    script:       "scripts/prospecting-engine.ts",
    description:  "Outbound — Identifica leads em fóruns, LinkedIn e comunidades",
    dependencies: [],
    chains:       ["traction", "all"],
  },
  {
    id:           "content-inbound-factory",
    script:       "scripts/content-inbound-factory.ts",
    description:  "Inbound — Criação de artigos, posts e threads para distribuição orgânica",
    dependencies: [],
    chains:       ["traction", "all"],
  },
  {
    id:           "funnel-optimizer",
    script:       "scripts/funnel-optimizer.ts",
    description:  "Conversion — Avalia métricas de funil e sugere melhorias na LP/Copy",
    dependencies: ["prospecting-engine"],
    chains:       ["conversion", "all"],
  },
  {
    id:           "lead-magnet-creator",
    script:       "scripts/lead-magnet-creator.ts",
    description:  "Incentive — Gera ferramentas gratuitas ou e-books para captura de email",
    dependencies: [],
    chains:       ["conversion", "all"],
  },
];

// ─── Topological Sort (Kahn's Algorithm) ─────────────────────────────────────

function topoSort(nodes: ScriptNode[]): ScriptNode[] {
  const idMap    = new Map(nodes.map((n) => [n.id, n]));
  const inDegree = new Map(nodes.map((n) => [n.id, 0]));
  const adj      = new Map(nodes.map((n) => [n.id, [] as string[]]));

  for (const node of nodes) {
    for (const dep of node.dependencies) {
      if (idMap.has(dep)) {
        adj.get(dep)!.push(node.id);
        inDegree.set(node.id, (inDegree.get(node.id) || 0) + 1);
      }
      // Missing dep: silently ignore (script not in selected chain)
    }
  }

  const queue:  ScriptNode[] = nodes.filter((n) => (inDegree.get(n.id) || 0) === 0);
  const result: ScriptNode[] = [];

  while (queue.length > 0) {
    // Sort queue by registry order for determinism
    queue.sort((a, b) => REGISTRY.indexOf(a) - REGISTRY.indexOf(b));
    const node = queue.shift()!;
    result.push(node);

    for (const neighborId of (adj.get(node.id) || [])) {
      const neighbor = idMap.get(neighborId)!;
      const newDeg   = (inDegree.get(neighborId) || 1) - 1;
      inDegree.set(neighborId, newDeg);
      if (newDeg === 0) queue.push(neighbor);
    }
  }

  if (result.length !== nodes.length) {
    console.warn("⚠️  Ciclo detectado no grafo — usando ordem de registro.");
    return [...nodes];
  }

  return result;
}

// ─── Quiet Mode: linha merece aparecer no terminal? ──────────────────────────

const DISPLAY_PATTERNS = [
  /^[✅❌⚠️🚫📋🔵⏭️🤖📁🌐🔌📤]/u,   // emojis de status
  /\b(OK|FALHOU|ERRO|ERROR|SUCESSO|FAILED|COMPLETED|score|Score|verdict|gate|Gate|Deploy|deploy|QA|audit|Phase|phase|FASE|lifecycle)\b/i,
  /→\s+reports\//,          // relatórios gerados
  /lifecycle\/phase/,        // logs de fase
  /workspace\/.+\.(md|json|sh|ts)/, // artefatos
  /^\s*(✓|✗)\s+\w/,        // checklist items
  /^\s*[0-9]+\.\s+\[/,      // script list
  /Pipeline.*interrompido/i,
];

function shouldDisplayLine(line: string): boolean {
  if (!line.trim()) return false;
  return DISPLAY_PATTERNS.some((p) => p.test(line));
}

// ─── Script Runner ────────────────────────────────────────────────────────────

async function runNode(node: ScriptNode): Promise<RunResult> {
  const started_at  = new Date().toISOString();
  const scriptPath  = path.resolve(ROOT, node.script);
  const extraArgs   = node.args || [];
  const projectFlag = `--project=${PROJECT_ID}`;
  // Pass through any extra CLI args (e.g. --concept, --skip-deploy, --dry-run for child)
  const passthroughArgs = cliArgs.filter(a =>
    !a.startsWith("--chain=") && !a.startsWith("--project=") &&
    a !== "--list" && a !== "--force" && a !== "--dry-run"
  );
  // Em modo quiet (padrão), injeta --quiet nos scripts filhos; verbose passa --verbose
  const quietFlag   = QUIET ? ["--quiet"] : [];
  const nodeCmd     = "node";
  const fullArgs    = ["--import", "tsx", node.script, projectFlag, ...extraArgs, ...passthroughArgs, ...quietFlag];
  const display     = `${nodeCmd} ${fullArgs.join(" ")}`;

  // ── Header compacto ──────────────────────────────────────────────────────
  console.log(`\n┌─[${"─".repeat(48)}]`);
  console.log(`│  [${new Date().toISOString().slice(11,19)}] INICIANDO: ${node.id}`);
  console.log(`│  ${node.description}`);
  if (!QUIET) {
    console.log(`│  Script: ${display}`);
  }
  console.log(`└${"─".repeat(50)}`);

  if (DRY_RUN) {
    console.log("  [DRY-RUN] Pulando execução.");
    return { id: node.id, status: "dry-run", exit_code: 0, started_at, ended_at: new Date().toISOString() };
  }

  if (!fs.existsSync(scriptPath)) {
    const err = `Script não encontrado: ${node.script}`;
    console.error(`  ❌ ${err}`);
    return { id: node.id, status: "failed", exit_code: 1, started_at, ended_at: new Date().toISOString(), error: err };
  }

  // Check condition
  if (node.condition && !node.condition()) {
    console.log("  ⏭️  Condição não atendida — pulando.");
    return { id: node.id, status: "skipped", exit_code: 0, started_at, ended_at: new Date().toISOString() };
  }

  // ── Execução ─────────────────────────────────────────────────────────────
  if (!QUIET) {
    // Modo verbose: herda stdio completo (comportamento anterior)
    try {
      await execa(nodeCmd, fullArgs, { cwd: ROOT, stdio: "inherit" });
      const elapsed = ((Date.now() - new Date(started_at).getTime()) / 1000).toFixed(1);
      console.log(`\n  ✅ ${node.id} — OK (${elapsed}s)`);
      return { id: node.id, status: "success", exit_code: 0, started_at, ended_at: new Date().toISOString() };
    } catch (err: any) {
      const msg = err?.message || String(err);
      console.error(`\n  ❌ ${node.id} — FALHOU: ${msg}`);
      return { id: node.id, status: "failed", exit_code: err?.exitCode || 1, started_at, ended_at: new Date().toISOString(), error: msg };
    }
  }

  // ── Modo Quiet: captura output, salva em log, mostra só status ───────────
  const logsDir  = path.join(ROOT, "reports", "run-logs");
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

  const logDate  = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const logFile  = path.join(logsDir, `${node.id}-${logDate}.log`);
  const logStream = fs.createWriteStream(logFile, { flags: "a" });

  logStream.write(`=== ${node.id} | Started: ${started_at} ===\n`);
  logStream.write(`Script: ${display}\n\n`);

  try {
    const proc = execa(nodeCmd, fullArgs, { cwd: ROOT, stdio: ["inherit", "pipe", "pipe"] });

    // Stream stdout/stderr para o arquivo de log (não para o terminal)
    proc.stdout?.on("data", (chunk: Buffer) => {
      logStream.write(chunk);
      // Re-exibe apenas linhas que parecem status/erro/artefato
      const lines = chunk.toString().split("\n");
      for (const line of lines) {
        if (shouldDisplayLine(line)) {
          console.log(`  │ ${line.trim()}`);
        }
      }
    });
    proc.stderr?.on("data", (chunk: Buffer) => {
      logStream.write(`[ERR] ${chunk}`);
      console.error(`  │ ⚠️  ${chunk.toString().trim().slice(0, 120)}`);
    });

    await proc;

    const elapsed = ((Date.now() - new Date(started_at).getTime()) / 1000).toFixed(1);
    logStream.write(`\n=== COMPLETED: success | ${elapsed}s ===\n`);
    logStream.end();

    console.log(`  └─ ✅ ${node.id} — OK (${elapsed}s) | log → reports/run-logs/${path.basename(logFile)}`);
    return { id: node.id, status: "success", exit_code: 0, started_at, ended_at: new Date().toISOString() };

  } catch (err: any) {
    const msg    = err?.message || String(err);
    const elapsed = ((Date.now() - new Date(started_at).getTime()) / 1000).toFixed(1);
    logStream.write(`\n=== FAILED: ${msg} | ${elapsed}s ===\n`);
    logStream.end();

    console.error(`  └─ ❌ ${node.id} — FALHOU (${elapsed}s) | log → reports/run-logs/${path.basename(logFile)}`);
    return { id: node.id, status: "failed", exit_code: err?.exitCode || 1, started_at, ended_at: new Date().toISOString(), error: msg };
  }
}

// ─── List Mode ────────────────────────────────────────────────────────────────

function listAll() {
  const chains: ChainName[] = ["flow", "audit", "full", "stage0", "cycle", "deploy", "all"];

  console.log("\n╔════════════════════════════════════════════════════════╗");
  console.log("║   Orchestrator — Script Registry                       ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  for (const chain of chains) {
    const nodes = REGISTRY.filter((n) => n.chains.includes(chain));
    if (nodes.length === 0) continue;
    const sorted = topoSort(nodes);

    console.log(`\n── Chain: ${chain.toUpperCase()} (${sorted.length} scripts) ──`);
    sorted.forEach((n, i) => {
      const deps  = n.dependencies.length > 0 ? ` ← [${n.dependencies.join(", ")}]` : "";
      const hasScript = fs.existsSync(path.resolve(ROOT, n.script)) ? "✓" : "✗";
      console.log(`  ${i + 1}. [${hasScript}] ${n.id}${deps}`);
      console.log(`       ${n.script}`);
      console.log(`       ${n.description}`);
    });
  }

  console.log("\nUso: npx tsx scripts/orchestrator.ts --chain=<chain> [--project=<id>] [--concept='...'] [--dry-run] [--force]");
  console.log("     --chain=project  → lifecycle completo de novo projeto + auditoria");
  console.log("     --dry-run  → mostra ordem sem executar");
  console.log("     --force    → continua após falhas\n");
}

// ─── Pipeline Report ──────────────────────────────────────────────────────────

function writePipelineReport(chain: string, sorted: ScriptNode[], results: RunResult[]) {
  const reportDir  = path.join(ROOT, "reports");
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });

  const date    = new Date().toISOString().split("T")[0];
  const report  = {
    chain,
    project:      PROJECT_ID,
    executed_at:  new Date().toISOString(),
    dry_run:      DRY_RUN,
    forced:       FORCE,
    summary: {
      total:    results.length,
      success:  results.filter((r) => r.status === "success").length,
      failed:   results.filter((r) => r.status === "failed").length,
      skipped:  results.filter((r) => r.status === "skipped").length,
      dry_run:  results.filter((r) => r.status === "dry-run").length,
    },
    execution_order: sorted.map((n) => n.id),
    results: results.map((r) => ({
      ...r,
      script: sorted.find((n) => n.id === r.id)?.script || "",
      description: sorted.find((n) => n.id === r.id)?.description || "",
    })),
  };

  const reportPath = path.join(reportDir, `orchestrator-${chain}-${date}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf-8");
  console.log(`\n  📋 Relatório → reports/orchestrator-${chain}-${date}.json`);
  return report;
}

// ─── Status Mode ──────────────────────────────────────────────────────────────

async function checkStatus() {
  console.log("\n╔════════════════════════════════════════════════════════╗");
  console.log("║   One Agent Corp — Status Report                       ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  const workspaceRoot = path.join(ROOT, "workspace");
  if (!fs.existsSync(workspaceRoot)) {
    console.log("📂 Pasta workspace/ não encontrada.");
    return;
  }

  const projects = fs.readdirSync(workspaceRoot).filter(f => 
    fs.statSync(path.join(workspaceRoot, f)).isDirectory() && f !== ".git"
  );

  if (projects.length === 0) {
    console.log("📭 Nenhum projeto ativo encontrado.");
    console.log("💡 Sugestão: npx tsx scripts/orchestrator.ts --chain=project --concept='Nova ideia' --project=novo-id");
    return;
  }

  console.log(`📊 Total de Projetos: ${projects.length}\n`);

  const activeProjects = [];
  const blockedProjects = [];
  const completedProjects = [];

  for (const pid of projects) {
    const projectDir = path.join(workspaceRoot, pid);
    const contextPath = path.join(projectDir, "context.json");
    const swarmTree = path.join(projectDir, ".swarm-tree");
    const finalReport = path.join(swarmTree, "final-report.md");
    
    let status = "in_progress";
    let phase = "unknown";
    
    if (fs.existsSync(contextPath)) {
      try {
        const ctx = JSON.parse(fs.readFileSync(contextPath, "utf-8"));
        status = ctx.status || status;
        phase = ctx.phase || phase;
      } catch (e) {}
    }

    const isDone = fs.existsSync(finalReport) && fs.readFileSync(finalReport, "utf-8").includes("SUCESSO");
    
    if (isDone) {
      completedProjects.push({ id: pid, phase });
    } else if (status === "BLOCKED") {
      blockedProjects.push({ id: pid, phase });
    } else {
      activeProjects.push({ id: pid, phase });
    }
  }

  if (activeProjects.length > 0) {
    console.log("🚀 EM ANDAMENTO:");
    activeProjects.forEach(p => console.log(`   - ${p.id.padEnd(25)} [Fase: ${p.phase}]`));
    console.log("");
  }

  if (blockedProjects.length > 0) {
    console.log("⚠️  PRECISAM DE ATENÇÃO (BLOQUEADOS):");
    blockedProjects.forEach(p => {
      console.log(`   - ${p.id.padEnd(25)} [Fase: ${p.phase}]`);
      console.log(`     Dica: npx tsx scripts/flow-intelligence.ts --project=${p.id}`);
    });
    console.log("");
  }

  if (completedProjects.length > 0) {
    console.log("✅ FINALIZADOS:");
    completedProjects.forEach(p => console.log(`   - ${p.id.padEnd(25)} [Fase: ${p.phase}]`));
    console.log("");
  }

  if (activeProjects.length === 0 && blockedProjects.length === 0) {
    console.log("💤 Nenhuma tarefa pendente. O orquestrador está ocioso.");
    console.log("✨ Pronto para novos projetos.");
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (LIST_MODE) { listAll(); return; }
  if (STATUS_MODE) { await checkStatus(); return; }

  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║   Swarm OS v4.2 — Master Pipeline Orchestrator       ║");
  console.log("╚══════════════════════════════════════════════════════╝");
  console.log(`\n  Chain:   ${CHAIN}`);
  console.log(`  Projeto: ${PROJECT_ID}`);
  console.log(`  Flags:   ${[DRY_RUN && "dry-run", FORCE && "force", QUIET && "quiet (padrão)", !QUIET && "verbose"].filter(Boolean).join(", ") || "none"}`);

  // 0. Preparar Git Branch (se não for o projeto principal)
  if (PROJECT_ID !== "one-agent-corp") {
    await prepareBranch(PROJECT_ID);
  }

  // 1. Filtrar scripts da chain selecionada
  const selected = REGISTRY.filter((n) => n.chains.includes(CHAIN));

  if (selected.length === 0) {
    console.error(`\n❌ Chain desconhecida: "${CHAIN}"`);
    console.error(`   Chains disponíveis: flow, audit, full, stage0, deploy, cycle, all`);
    console.error(`   Use --list para ver todos os scripts.`);
    process.exit(1);
  }

  // 2. Topological sort
  const sorted = topoSort(selected);

  console.log(`\n📋 Ordem de execução (${sorted.length} scripts):`);
  sorted.forEach((n, i) => {
    const exists = fs.existsSync(path.resolve(ROOT, n.script));
    const icon   = exists ? "✓" : "✗";
    const deps   = n.dependencies.filter((d) => selected.find((s) => s.id === d));
    const depStr = deps.length > 0 ? ` ← ${deps.join(", ")}` : "";
    console.log(`  ${i + 1}. [${icon}] ${n.id}${depStr}`);
  });

  if (DRY_RUN) {
    console.log("\n[DRY-RUN] Nenhum script será executado.");
  }

  // 3. Executar em ordem
  console.log("\n⚡ Iniciando pipeline...");
  console.log("═".repeat(54));

  const results: RunResult[] = [];
  let   failCount = 0;

  for (const node of sorted) {
    const result = await runNode(node);
    results.push(result);

    if (result.status === "failed") {
      failCount++;
      if (!FORCE) {
        console.error(`\n🚫 Pipeline interrompido em: ${node.id}`);
        console.error(`   Use --force para continuar após falhas.`);
        break;
      }
      console.warn(`\n⚠️  Continuando após falha em ${node.id} (--force ativo)...`);
    }
  }

  // 4. Finalizar Git Branch
  if (PROJECT_ID !== "one-agent-corp") {
    await finalizeBranch(PROJECT_ID, failCount === 0);
  }

  // 5. Relatório
  const report = writePipelineReport(CHAIN, sorted, results);

  // 5. Sumário final
  const W = 54;
  console.log("\n╔" + "═".repeat(W) + "╗");
  console.log(`║  Pipeline "${CHAIN.toUpperCase()}" — ${failCount === 0 ? "✅ SUCESSO" : "❌ COM FALHAS"}${" ".repeat(Math.max(0, W - 17 - CHAIN.length))}║`);
  console.log("╚" + "═".repeat(W) + "╝");
  console.log(`\n  Total:    ${report.summary.total}`);
  console.log(`  ✅ OK:     ${report.summary.success}`);
  console.log(`  ❌ Falhas: ${report.summary.failed}`);
  console.log(`  ⏭️  Pulados: ${report.summary.skipped}`);

  if (failCount > 0) process.exit(1);
}

main().catch((e) => {
  console.error("❌ Erro no Orchestrator:", e);
  process.exit(1);
});
