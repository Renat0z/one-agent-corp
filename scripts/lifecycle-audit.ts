/**
 * lifecycle-audit.ts
 * Department of QA & Audit — Swarm OS v4.2
 *
 * Lê todos os logs do lifecycle, avalia se o fluxo ocorreu como deveria,
 * encontra falhas e oportunidades de melhoria.
 * Minds: Andy Grove (OKR/Intel) + Ray Dalio (Principles) + Sean Ellis (Growth)
 *
 * Uso: npx tsx scripts/lifecycle-audit.ts --project={projectId}
 */

import * as fs   from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import {
  createAgentSession,
  SessionManager,
  AuthStorage,
  ModelRegistry,
} from "@mariozechner/pi-coding-agent";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ─── Config ──────────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
const PROJECT_ID = (argv.find(a => a.startsWith("--project=")) || "--project=pingboard").replace("--project=", "");
const ROOT       = path.resolve(__dirname, "..");
const WS         = path.join(ROOT, "workspace", PROJECT_ID);
const LC         = path.join(WS, "lifecycle");
const MINDS_DIR  = "C:/Users/Administrador/.claude/minds";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readJson<T>(p: string): T | null {
  try { return JSON.parse(fs.readFileSync(p, "utf-8")) as T; }
  catch { return null; }
}

function readText(p: string): string {
  try { return fs.readFileSync(p, "utf-8"); }
  catch { return ""; }
}

function save(relPath: string, content: string) {
  const full = path.join(WS, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, "utf-8");
  return relPath;
}

function ts() { return new Date().toISOString(); }

function loadMind(mindId: string): { framework: string; thinking: string } {
  const base = path.join(MINDS_DIR, mindId);
  return {
    framework: readText(path.join(base, "artifacts", "framework-primary.md")).slice(0, 900),
    thinking:  readText(path.join(base, "sources",   "thinking_dna.yaml")).slice(0, 600),
  };
}

// ─── Load all lifecycle logs ──────────────────────────────────────────────────

interface PhaseLog {
  phase: {
    phaseId:   string;
    label:     string;
    status:    string;
    artifacts: string[];
    summary:   string;
    keyData:   Record<string, unknown>;
    startedAt: string;
    endedAt:   string;
  };
  gate?: {
    verdict: string;
    reason:  string;
    advisor: string;
    mods:    Array<{ type: string; phaseId?: string; note: string }>;
  };
}

function loadLifecycleLogs(): PhaseLog[] {
  if (!fs.existsSync(LC)) return [];
  const files = fs.readdirSync(LC)
    .filter(f => f.startsWith("phase-") && f.endsWith(".json"))
    .sort();
  return files.map(f => readJson<PhaseLog>(path.join(LC, f))).filter(Boolean) as PhaseLog[];
}

// ─── Claude session ───────────────────────────────────────────────────────────

let _sess: any = null;
async function getSession() {
  if (_sess) return _sess;
  const auth = AuthStorage.create();
  const reg  = new ModelRegistry(auth);
  _sess = await createAgentSession({ sessionManager: SessionManager.inMemory(), authStorage: auth, modelRegistry: reg });
  return _sess;
}

async function ai(prompt: string, label: string): Promise<string> {
  console.log(`\n  🤖 ${label}...`);
  const { session } = await getSession();
  const chunks: string[] = [];
  const unsub = session.subscribe((e: any) => {
    if (e.type === "message_update" && e.assistantMessageEvent?.type === "text_delta") {
      const d = e.assistantMessageEvent.delta as string;
      process.stdout.write(d);
      chunks.push(d);
    }
  });
  try { await session.prompt(prompt); }
  finally { unsub(); }
  console.log();
  return chunks.join("");
}

// ─── Build audit context ──────────────────────────────────────────────────────

function buildAuditContext(logs: PhaseLog[]): string {
  const summary = readJson<any>(path.join(LC, "pipeline-summary.json"));
  const state   = readJson<any>(path.join(LC, "pipeline-state.json"));

  let ctx = `PROJECT: ${PROJECT_ID}\n`;
  ctx += `CONCEPT: ${state?.concept || "N/A"}\n`;
  ctx += `COMPLETED AT: ${summary?.completedAt || "N/A"}\n`;
  ctx += `TOTAL PHASES: ${logs.length}\n\n`;
  ctx += "═══ PHASE-BY-PHASE LOG ═══\n\n";

  logs.forEach((log, i) => {
    ctx += `PHASE ${i + 1}: ${log.phase.label}\n`;
    ctx += `  Status:    ${log.phase.status}\n`;
    ctx += `  Artifacts: ${log.phase.artifacts.length} files\n`;
    ctx += `  Summary:   ${log.phase.summary.slice(0, 150)}\n`;
    ctx += `  Duration:  ${durationMs(log.phase.startedAt, log.phase.endedAt)}ms\n`;
    if (log.gate) {
      ctx += `  Gate:      ${log.gate.verdict.toUpperCase()} — ${log.gate.reason.slice(0, 100)}\n`;
      if (log.gate.mods.length > 0) {
        ctx += `  Mods:      ${log.gate.mods.map(m => `${m.type}(${m.phaseId})`).join(", ")}\n`;
      }
    }
    ctx += "\n";
  });

  return ctx;
}

function durationMs(start: string, end: string): number {
  try { return new Date(end).getTime() - new Date(start).getTime(); }
  catch { return 0; }
}

// ─── Metrics ──────────────────────────────────────────────────────────────────

interface AuditMetrics {
  totalPhases:       number;
  successPhases:     number;
  partialPhases:     number;
  failedPhases:      number;
  gateRedirects:     number;
  gateHalts:         number;
  totalArtifacts:    number;
  totalDurationMs:   number;
  flowHealthScore:   number;  // 0-100
  redirectRate:      number;  // 0-1 (lower is better)
}

function computeMetrics(logs: PhaseLog[]): AuditMetrics {
  const success   = logs.filter(l => l.phase.status === "success").length;
  const partial   = logs.filter(l => l.phase.status === "partial").length;
  const failed    = logs.filter(l => l.phase.status === "failed").length;
  const redirects = logs.filter(l => l.gate?.verdict === "redirect").length;
  const halts     = logs.filter(l => l.gate?.verdict === "halt").length;
  const artifacts = logs.reduce((acc, l) => acc + l.phase.artifacts.length, 0);
  const duration  = logs.reduce((acc, l) => acc + durationMs(l.phase.startedAt, l.phase.endedAt), 0);

  const total = logs.length || 1;
  const score = Math.max(0, Math.round(
    (success / total) * 60 +
    (1 - redirects / total) * 20 +
    (artifacts > 0 ? 15 : 0) +
    (failed === 0 ? 5 : 0)
  ));

  return {
    totalPhases: logs.length,
    successPhases: success,
    partialPhases: partial,
    failedPhases:  failed,
    gateRedirects: redirects,
    gateHalts:     halts,
    totalArtifacts: artifacts,
    totalDurationMs: duration,
    flowHealthScore: score,
    redirectRate: redirects / total,
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║  Department of QA & Audit — Lifecycle Evaluation         ║");
  console.log("║  Minds: Andy Grove · Ray Dalio · Sean Ellis              ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log(`\n🎯 Projeto: ${PROJECT_ID}`);

  // 1. Load logs
  const logs = loadLifecycleLogs();
  if (logs.length === 0) {
    console.error(`\n❌ Nenhum log de lifecycle encontrado em: ${LC}`);
    console.error(`   Execute primeiro: npx tsx scripts/project-lifecycle.ts --project=${PROJECT_ID}`);
    process.exit(1);
  }
  console.log(`\n  ✓ ${logs.length} fases carregadas do lifecycle`);

  // 2. Compute metrics
  const metrics = computeMetrics(logs);
  console.log(`\n  📊 Métricas rápidas:`);
  console.log(`     Flow Health Score:  ${metrics.flowHealthScore}/100`);
  console.log(`     Fases com sucesso:  ${metrics.successPhases}/${metrics.totalPhases}`);
  console.log(`     Redirects de gate:  ${metrics.gateRedirects}`);
  console.log(`     Total de artefatos: ${metrics.totalArtifacts}`);
  console.log(`     Duração total:      ${(metrics.totalDurationMs / 1000 / 60).toFixed(1)} min`);

  // 3. Load minds
  console.log("\n📚 Carregando minds do board de auditoria...");
  const grove  = loadMind("ray_dalio");        // Andy Grove not in minds, use Dalio+Grove proxies
  const dalio  = loadMind("ray_dalio");
  const ellis  = loadMind("sean_ellis");
  console.log("  ✓ Ray Dalio (Principles) carregado");
  console.log("  ✓ Sean Ellis (Growth Velocity) carregado");

  // 4. Build audit context
  const auditCtx = buildAuditContext(logs);

  // 5. Phase-by-phase evaluation
  console.log("\n🔬 [QA Board] Avaliando cada fase do lifecycle...\n");
  console.log("─".repeat(62));

  const phaseEval = await ai(`
You are the Department of QA & Audit at One Agent Corp.
Evaluate this project lifecycle execution using these frameworks:

RAY DALIO — Principles Framework:
${dalio.framework.slice(0, 600)}

SEAN ELLIS — Growth Velocity:
${ellis.framework.slice(0, 400)}

ANDY GROVE — OKR & Management by Exception:
Core principle: "Only evaluate if the output meets the KEY RESULT, not the activity."

═══ LIFECYCLE DATA ═══
${auditCtx}

═══ YOUR TASK ═══
Produce a structured audit using EXACTLY this format:

## LIFECYCLE AUDIT REPORT
**Project:** ${PROJECT_ID}
**Audited At:** ${ts()}

### Phase-by-Phase Evaluation

| Phase | Status | Gate | Score | Key Issue |
|-------|--------|------|-------|-----------|
[one row per phase, score 1-10]

### Flow Health Analysis

**What went well:**
- [bullet 1]
- [bullet 2]
- [bullet 3]

**What failed or was suboptimal:**
- [bullet 1]
- [bullet 2]
- [bullet 3]

**Gate effectiveness (did gates catch real issues?):**
[2-3 sentences]

**Adaptive flow usage (were modifications useful?):**
[2-3 sentences]

### Andy Grove — OKR Lens
> Did each phase produce its KEY RESULT, not just activity?
[3-4 bullets]

### Ray Dalio — Principles Lens
> Which principles were violated? Which were honored?
[3-4 bullets, each starting with "Principle: "]

### Sean Ellis — Velocity Lens
> Where did the cycle lose speed? What would accelerate future runs?
[3-4 bullets]

### Bottleneck Analysis (Theory of Constraints)
**System constraint:** [the ONE thing that limited this pipeline the most]
**Root cause:** [why]
**Fix:** [specific action]

### Improvements for Next Lifecycle (ICE Scored)
| Improvement | Impact | Confidence | Ease | ICE | Owner |
|---|---|---|---|---|---|
[top 5 improvements, ranked by ICE = I×C×E/3]

### Flow Score: X/100
**Verdict:** EXCELLENT (>85) | GOOD (70-85) | NEEDS WORK (50-70) | FAILED (<50)

### Single Most Important Action
> [One sentence: the most impactful change for the next project lifecycle]
`.trim(), "QA Board — Avaliação Fase a Fase");

  // 6. Process Evolution (what to change next time)
  console.log("\n─".repeat(62));
  const evolution = await ai(`
You are the Chief Process Officer at One Agent Corp.

Based on this lifecycle execution of project "${PROJECT_ID}":

METRICS:
- Flow Health Score: ${metrics.flowHealthScore}/100
- Phases succeeded: ${metrics.successPhases}/${metrics.totalPhases}
- Gate redirects: ${metrics.gateRedirects}
- Total artifacts: ${metrics.totalArtifacts}

AUDIT FINDINGS (excerpt):
${phaseEval.slice(0, 1500)}

Write a PROCESS EVOLUTION entry — what specific changes should be made to the
project-lifecycle.ts script and orchestrator to make the NEXT project run better.

Format:
## PROCESS EVOLUTION — ${PROJECT_ID}
**Date:** ${ts()}

### Root Cause of Main Bottleneck
[2 sentences]

### Code Changes Required
1. **[File: scripts/X.ts]** — [what to change and why]
2. **[File: scripts/Y.ts]** — [what to change and why]
3. [up to 5 items]

### Gate Protocol Improvements
[2-3 specific changes to how gates evaluate phases]

### New Phases to Add
[if any; format: Phase name → Purpose → After which existing phase]

### Phases to Remove or Merge
[if any]

### One-Line Summary for CLAUDE.md
[a single improvement directive to add to the project instructions]
`.trim(), "Process Evolution — O que melhorar");

  // 7. Build final audit JSON
  const auditJson = {
    version:       "1.0",
    project:       PROJECT_ID,
    auditedAt:     ts(),
    auditors:      ["ray_dalio (principles)", "sean_ellis (velocity)", "andy_grove (okr)"],
    metrics,
    verdict: metrics.flowHealthScore >= 85 ? "EXCELLENT"
           : metrics.flowHealthScore >= 70 ? "GOOD"
           : metrics.flowHealthScore >= 50 ? "NEEDS_WORK"
           : "FAILED",
    auditReport:   phaseEval,
    processEvolution: evolution,
    phases: logs.map((l, i) => ({
      index:     i + 1,
      phaseId:   l.phase.phaseId,
      status:    l.phase.status,
      artifacts: l.phase.artifacts.length,
      gateVerdict: l.gate?.verdict || "none",
      gateMods:  l.gate?.mods?.length || 0,
    })),
  };

  // 8. Write outputs
  save("lifecycle/audit-report.md",
    `# Lifecycle Audit — ${PROJECT_ID}\n\n${phaseEval}\n\n---\n\n## Process Evolution\n\n${evolution}`
  );
  save("lifecycle/audit.json", JSON.stringify(auditJson, null, 2));

  // Append to PROCESS_EVOLUTION.md
  const evolutionPath = path.join(ROOT, "PROCESS_EVOLUTION.md");
  const entry = `\n\n---\n\n## Lifecycle: ${PROJECT_ID} — ${ts()}\n\n${evolution}`;
  fs.appendFileSync(evolutionPath, entry, "utf-8");

  // 9. Print summary
  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║  ✅ Lifecycle Audit — Concluído                           ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log(`\n  Flow Health Score: ${metrics.flowHealthScore}/100`);
  console.log(`  Verdict:           ${auditJson.verdict}`);
  console.log(`  Fases avaliadas:   ${logs.length}`);
  console.log(`\n  📄 audit-report.md     → workspace/${PROJECT_ID}/lifecycle/`);
  console.log(`  📋 audit.json          → workspace/${PROJECT_ID}/lifecycle/`);
  console.log(`  📈 PROCESS_EVOLUTION.md → atualizado\n`);
}

main().catch(e => {
  console.error("❌ Lifecycle Audit error:", e);
  process.exit(1);
});
