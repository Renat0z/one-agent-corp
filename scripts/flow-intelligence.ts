/**
 * flow-intelligence.ts
 * Department of Flow Intelligence — Swarm OS v4.2
 *
 * Analisa o fluxo dos ciclos, mapeia gargalos via ICE Score,
 * e produz plano de ação ACID para o próximo ciclo.
 *
 * Uso: npx tsx scripts/flow-intelligence.ts --project={projectId}
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Config ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const projectArg = args.find((a) => a.startsWith("--project="));
const PROJECT_ID = projectArg ? projectArg.split("=")[1] : "one-agent-corp";

const ROOT = path.resolve(__dirname, "..");
const WORKSPACE = path.join(ROOT, "workspace", PROJECT_ID === "one-agent-corp" ? "" : PROJECT_ID);
const SWARM_TREE = path.join(ROOT, ".swarm-tree");
const FLOW_OUTPUT = path.join(WORKSPACE, "flow");
const DEPT_SPEC          = path.join(ROOT, "departments", "flow-intelligence", "department.md");
const REVENUE_CULTURE_SPEC = path.join(ROOT, "departments", "revenue-culture",   "department.md");

// ─── Helpers ───────────────────────────────────────────────────────────────

function readJson<T>(filePath: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
  } catch {
    return null;
  }
}

function readText(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function timestamp(): string {
  return new Date().toISOString();
}

// ─── Data Ingestion ─────────────────────────────────────────────────────────

interface ContextJson {
  status?: string;
  currentPhase?: string;
  bottleneck?: string;
  nextCyclePriority?: string;
  [key: string]: unknown;
}

interface ContextPack {
  domains?: Array<{ id: string; [key: string]: unknown }>;
  task?: string;
  [key: string]: unknown;
}

interface Reflection {
  domain?: string;
  domain_id?: string;
  verdict: "pass" | "fail";
  timestamp?: string;
  [key: string]: unknown;
}

function getDomainName(r: Reflection): string {
  return r.domain || r.domain_id || "unknown";
}

function ingestCycleData() {
  console.log("\n📥 [Flow Intelligence] Ingestão de dados do ciclo...\n");

  // 1. context.json
  const contextPath = path.join(WORKSPACE, "context.json");
  const context = readJson<ContextJson>(contextPath);
  console.log(`  ✓ context.json: ${context ? "carregado" : "não encontrado"}`);

  // 2. context-pack.json
  const contextPack = readJson<ContextPack>(path.join(SWARM_TREE, "context-pack.json"));
  console.log(`  ✓ context-pack.json: ${contextPack ? "carregado" : "não encontrado"}`);

  // 3. reflections
  const reflectionsDir = path.join(SWARM_TREE, "reflections");
  const reflections: Reflection[] = [];
  if (fs.existsSync(reflectionsDir)) {
    fs.readdirSync(reflectionsDir).forEach((file) => {
      if (file.endsWith(".json")) {
        const r = readJson<Reflection>(path.join(reflectionsDir, file));
        if (r) reflections.push(r);
      }
    });
  }
  console.log(`  ✓ reflections: ${reflections.length} domínios lidos`);

  // 4. manifests
  const manifestsDir = path.join(SWARM_TREE, "manifests");
  const manifests: string[] = [];
  if (fs.existsSync(manifestsDir)) {
    manifests.push(...fs.readdirSync(manifestsDir).filter((f) => f.endsWith(".json")));
  }
  console.log(`  ✓ manifests: ${manifests.length} arquivos`);

  // 5. audit-report
  const auditReport = readText(path.join(WORKSPACE, "qa", "audit-report.md"));
  console.log(`  ✓ audit-report.md: ${auditReport ? "carregado" : "não encontrado"}`);

  // 6. final-report
  const finalReport = readText(path.join(SWARM_TREE, "final-report.md"));
  const cycleStatus = finalReport?.includes("SUCESSO") ? "✅ SUCESSO" : "⚠️ INCOMPLETO";
  console.log(`  ✓ final-report.md: ${finalReport ? cycleStatus : "não encontrado"}`);

  // 7. revenue-gate results (Department of Revenue Culture output)
  const revenueGate = readJson<{
    allPassed: boolean;
    passedCount: number;
    failedGates: string[];
    gates: Record<string, { label: string; passed: boolean; value: string; score: number; required: string }>;
  }>(path.join(WORKSPACE, "revenue-gate", "gate-results.json"));
  if (revenueGate) {
    console.log(`  ✓ revenue-gate: ${revenueGate.allPassed ? "✅ PASS" : `❌ ${revenueGate.failedGates.length} gate(s) falhando`} (${revenueGate.passedCount}/4)`);
  } else {
    console.log(`  ✓ revenue-gate: não executado ainda`);
  }

  // 8. revenue_snapshot from context.json
  const revenueSnapshot = (context as any)?.revenue_snapshot || null;
  if (revenueSnapshot) {
    console.log(`  ✓ revenue_snapshot: MRR=$${revenueSnapshot.mrr ?? 0} | Leads=${revenueSnapshot.leads_this_cycle ?? 0} | Channel=${revenueSnapshot.channel ?? "undefined"}`);
  }

  return { context, contextPack, reflections, manifests, auditReport, finalReport, revenueGate, revenueSnapshot };
}

// ─── Bottleneck Analysis ────────────────────────────────────────────────────

interface Bottleneck {
  rank: number;
  name: string;
  deptAffected: string;
  impact: number;
  confidence: number;
  ease: number;
  ice: number;
  type: "decisão" | "comunicação" | "sistema" | "delegação" | "valor" | "comercial";
  rootCause: string;
}

function analyzeBottlenecks(data: ReturnType<typeof ingestCycleData>): Bottleneck[] {
  const { reflections, context, auditReport, revenueGate, revenueSnapshot } = data;

  const bottlenecks: Omit<Bottleneck, "rank" | "ice">[] = [];

  // Detecta domains com fail
  const failedDomains = reflections.filter((r) => r.verdict === "fail");
  failedDomains.forEach((domain) => {
    const domainName = getDomainName(domain);
    bottlenecks.push({
      name: `Domain "${domainName}" falhou na execução`,
      deptAffected: "Engineering / QA",
      impact: 8,
      confidence: 9,
      ease: 6,
      type: "sistema",
      rootCause: `Domínio ${domainName} retornou verdict:fail — possível dependência não resolvida ou task mal definida`,
    });
  });

  // Detecta bottleneck declarado no context.json
  if (context?.bottleneck) {
    bottlenecks.push({
      name: `Bottleneck declarado: ${context.bottleneck}`,
      deptAffected: "Admin / Strategy",
      impact: 9,
      confidence: 8,
      ease: 5,
      type: "decisão",
      rootCause: `Bottleneck explícito no context.json: "${context.bottleneck}"`,
    });
  }

  // Detecta problemas de auditoria
  if (auditReport) {
    const criticalCount = (auditReport.match(/CRITICAL/gi) || []).length;
    if (criticalCount >= 2) {
      bottlenecks.push({
        name: `${criticalCount} itens CRITICAL no audit-report`,
        deptAffected: "QA & Audit",
        impact: 9,
        confidence: 9,
        ease: 4,
        type: "sistema",
        rootCause: "Múltiplos itens críticos indicam problema sistêmico, não pontual",
      });
    }
  }

  // Gargalo de comunicação inter-departamental (heurística)
  if (data.manifests.length < 3 && reflections.length > 0) {
    bottlenecks.push({
      name: "Baixa produção de artefatos vs. domínios executados",
      deptAffected: "Engineering / Product",
      impact: 7,
      confidence: 6,
      ease: 7,
      type: "comunicação",
      rootCause: "Domínios executados sem artefatos suficientes — handoff implícito entre departamentos",
    });
  }

  // Gargalo de velocidade de ciclo
  const passCount = reflections.filter((r) => r.verdict === "pass").length;
  const totalDomains = data.contextPack?.domains?.length || reflections.length;
  if (totalDomains > 0 && passCount / totalDomains < 0.6) {
    bottlenecks.push({
      name: `Taxa de conclusão baixa: ${passCount}/${totalDomains} domínios concluídos`,
      deptAffected: "Todos",
      impact: 8,
      confidence: 8,
      ease: 5,
      type: "sistema",
      rootCause: "Menos de 60% dos domínios concluídos indica gargalo estrutural no fluxo",
    });
  }

  // ── Gargalos Comerciais (Department of Revenue Culture) ─────────────────────
  // Multiplicador: gargalos comerciais têm impact mínimo 8 (não faz sentido construir
  // sem ICP/canal definidos, independente do quão saudável está o pipeline técnico)

  if (revenueGate && !revenueGate.allPassed) {
    for (const [gateKey, gate] of Object.entries(revenueGate.gates)) {
      if (!gate.passed) {
        const isEconomics = gateKey === "unit_economics";
        bottlenecks.push({
          name:        `${gate.label} — ${gate.value}`,
          deptAffected: "Revenue Culture / Department of Product",
          impact:       isEconomics ? 9 : 8, // unit economics failure = existential
          confidence:   10,                  // deterministic — não é estimativa
          ease:         isEconomics ? 5 : 7,
          type:         "comercial" as any,
          rootCause:    `Gate falhou: ${gate.required}. Valor atual: "${gate.value}" (score ${gate.score}/10). ` +
                        `Re-executar fase correspondente: audience/offer/growth-pre.`,
        });
      }
    }
  }

  // Sem MRR nem leads após deploy = gargalo comercial de distribuição
  if (revenueSnapshot && revenueSnapshot.mrr === 0 && revenueSnapshot.leads_this_cycle === 0) {
    const hasChannel = !!(revenueSnapshot.channel && revenueSnapshot.channel !== "undefined" && revenueSnapshot.channel !== null);
    if (hasChannel) {
      bottlenecks.push({
        name:         `MRR=0 e Leads=0 — canal "${revenueSnapshot.channel}" não está gerando tração`,
        deptAffected: "Growth / Distribution",
        impact:       9,
        confidence:   8,
        ease:         6,
        type:         "comercial" as any,
        rootCause:    `Canal definido (${revenueSnapshot.channel}) mas sem resultado. ` +
                      `Hipóteses: volume baixo, targeting errado, ou oferta não ressoa. ` +
                      `Ação: revisar growth/pre-launch-channel.md e dobrar volume ou pivotar canal.`,
      });
    }
  }

  // Fallback: se nenhum gargalo detectado, registra ciclo saudável
  if (bottlenecks.length === 0) {
    bottlenecks.push({
      name: "Ciclo sem gargalos críticos detectados",
      deptAffected: "N/A",
      impact: 2,
      confidence: 7,
      ease: 10,
      type: "sistema",
      rootCause: "Todos os domínios passaram — análise preventiva para próximo ciclo",
    });
  }

  // Calcula ICE e rankeia
  const ranked: Bottleneck[] = bottlenecks
    .map((b, i) => ({
      ...b,
      rank: i + 1,
      ice: Math.round(((b.impact * b.confidence * b.ease) / 3) * 10) / 10,
    }))
    .sort((a, b) => b.ice - a.ice)
    .map((b, i) => ({ ...b, rank: i + 1 }));

  return ranked;
}

// ─── ACID Actions ───────────────────────────────────────────────────────────

interface AcidAction {
  bottleneck: string;
  ice: number;
  action: string;
  context: string;
  indicator: string;
  deadline: string;
}

function generateAcidActions(bottlenecks: Bottleneck[]): AcidAction[] {
  return bottlenecks.slice(0, 3).map((b) => {
    const actionMap: Record<Bottleneck["type"], Partial<AcidAction>> = {
      sistema: {
        action: `Revisar e corrigir a causa-raiz do gargalo "${b.name}" com decomposição em tasks de máximo 2 folhas`,
        context: `Department of Engineering — domain: fix-${b.deptAffected.toLowerCase().replace(/\s/g, "-")}`,
        indicator: `domain com verdict:pass no próximo reflection.json`,
        deadline: "Ciclo N+1",
      },
      decisão: {
        action: `Documentar decisão pendente sobre "${b.name}" no context.json e desbloquear fluxo`,
        context: `Admin (Flow Admin) — atualizar context.json com decisão explícita`,
        indicator: `context.json sem campo bottleneck vazio`,
        deadline: "Ciclo imediato",
      },
      comunicação: {
        action: `Criar artefato de handoff explícito para "${b.name}" no filesystem inter-departamental`,
        context: `Department of Engineering + Department of Product — criar contrato de interface`,
        indicator: `arquivo de handoff presente em workspace/${PROJECT_ID}/contracts/`,
        deadline: "Ciclo N+1",
      },
      delegação: {
        action: `Aplicar "Who Not How" para "${b.name}" — identificar quem executa, não como`,
        context: `Admin → delegar ao departamento correto via context.json atualizado`,
        indicator: `domain delegado com responsável explícito no context-pack.json`,
        deadline: "Ciclo N+1",
      },
      valor: {
        action: `Calcular Value Equation de "${b.name}" — cortar ou redesenhar se custo > valor`,
        context: `Department of Strategy — revisão do execution-plan.md`,
        indicator: `execution-plan.md revisado com ROI explícito por domain`,
        deadline: "Ciclo N+2",
      },
      comercial: {
        action: `Corrigir gate comercial "${b.name}" — re-executar fase correspondente (audience/offer/growth-pre) com dados mais específicos`,
        context: `Department of Revenue Culture — re-run npx tsx scripts/project-lifecycle.ts --concept="..." --project=${PROJECT_ID} (fases: audience/offer/growth-pre)`,
        indicator: `revenue-gate/gate-results.json com allPassed=true e revenue_snapshot.channel definido`,
        deadline: "Ciclo imediato — bloqueia arquitetura",
      },
    };

    const template = actionMap[b.type] || actionMap.sistema;
    return {
      bottleneck: b.name,
      ice: b.ice,
      action: template.action!,
      context: template.context!,
      indicator: template.indicator!,
      deadline: template.deadline!,
    };
  });
}

// ─── Script Map (tipo → script executor) ───────────────────────────────────

const SCRIPT_MAP: Record<Bottleneck["type"], { script: string | null; args: string[] }> = {
  sistema:      { script: "scripts/auto-audit.ts",            args: [] },
  comunicação:  { script: "scripts/post-cycle-reflection.ts", args: [] },
  decisão:      { script: null, args: [] }, // ação manual → update context.json
  delegação:    { script: null, args: [] }, // ação manual → reassign no context-pack
  valor:        { script: "scripts/pipeline-full-run.ts",     args: [] },
  comercial:    { script: null, args: [] }, // ação manual → re-executar fase audience/offer/growth-pre
};

// ─── JSON Writers ────────────────────────────────────────────────────────────

function writeGrowthActionsJson(
  bottlenecks: Bottleneck[],
  actions: AcidAction[],
  data: ReturnType<typeof ingestCycleData>
) {
  ensureDir(FLOW_OUTPUT);

  const passCount = data.reflections.filter((r) => r.verdict === "pass").length;
  const totalPlanned = data.contextPack?.domains?.length || data.reflections.length;

  const jsonActions = actions.map((a, i) => {
    const b = bottlenecks.find((bt) => bt.name === a.bottleneck) || bottlenecks[i];
    const scriptInfo = SCRIPT_MAP[b?.type || "sistema"];
    return {
      id: `action-${String(i + 1).padStart(3, "0")}`,
      rank: i + 1,
      bottleneck: a.bottleneck,
      ice_score: a.ice,
      type: b?.type || "sistema",
      root_cause: b?.rootCause || "",
      acid: {
        action:    a.action,
        context:   a.context,
        indicator: a.indicator,
        deadline:  a.deadline,
      },
      script:      scriptInfo.script,
      script_args: [
        `--project=${PROJECT_ID}`,
        ...scriptInfo.args,
      ],
      dependencies: i === 0 ? [] : [`action-${String(i).padStart(3, "0")}`],
      status: "pending" as const,
    };
  });

  const payload = {
    version: "1.0",
    project: PROJECT_ID,
    generated_at: timestamp(),
    generated_by: "Department of Flow Intelligence",
    status: "pending_strategy_review",
    summary: {
      bottlenecks_found:     bottlenecks.length,
      top_bottleneck:        bottlenecks[0]?.name || "none",
      top_ice_score:         bottlenecks[0]?.ice  || 0,
      top_bottleneck_type:   bottlenecks[0]?.type || "none",
      cycle_completion_rate: `${totalPlanned > 0 ? Math.round((passCount / totalPlanned) * 100) : 0}%`,
      domains_planned:       totalPlanned,
      domains_passed:        passCount,
      domains_failed:        data.reflections.filter((r) => r.verdict === "fail").length,
    },
    actions: jsonActions,
  };

  const jsonPath = path.join(FLOW_OUTPUT, "growth-actions.json");
  fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2), "utf-8");
  console.log(`  📋 growth-actions.json → ${jsonPath}`);
  return payload;
}

// ─── Report Writers ─────────────────────────────────────────────────────────

function writeBottleneckReport(
  bottlenecks: Bottleneck[],
  data: ReturnType<typeof ingestCycleData>
) {
  ensureDir(FLOW_OUTPUT);

  const { reflections } = data;
  const passCount = reflections.filter((r) => r.verdict === "pass").length;
  const failCount = reflections.filter((r) => r.verdict === "fail").length;
  const totalPlanned = data.contextPack?.domains?.length || reflections.length;

  const tableRows = bottlenecks
    .map(
      (b) =>
        `| ${b.rank} | ${b.name} | ${b.deptAffected} | ${b.impact} | ${b.confidence} | ${b.ease} | **${b.ice}** | ${b.type} |`
    )
    .join("\n");

  const report = `# Bottleneck Report — Análise de Ciclo
**Gerado por:** Department of Flow Intelligence
**Timestamp:** ${timestamp()}
**Projeto:** ${PROJECT_ID}

---

## Status do Ciclo

| Métrica | Valor |
|---------|-------|
| Domains planejados | ${totalPlanned} |
| Domains concluídos (pass) | ${passCount} |
| Domains com falha (fail) | ${failCount} |
| Domains não executados | ${totalPlanned - reflections.length} |
| Taxa de conclusão | ${totalPlanned > 0 ? Math.round((passCount / totalPlanned) * 100) : 0}% |

${data.context?.bottleneck ? `> ⚠️ **Bottleneck declarado no context.json:** "${data.context.bottleneck}"` : ""}

---

## Mapa de Gargalos (ICE Ranked)

| Rank | Gargalo | Dept Afetado | I | C | E | ICE | Tipo |
|------|---------|-------------|---|---|---|-----|------|
${tableRows}

> **ICE = (Impact × Confidence × Ease) / 3** | Escala: 1-10 por dimensão

---

## Análise por Lente

### 🔬 Sean Ellis — Cycle Velocity Lens
${
  passCount < totalPlanned
    ? `- Growth loop **quebrado**: ${failCount} domínios falharam, impedindo que o output alimentasse o próximo stage
- North Star Metric do ciclo possivelmente **não atingida** — revisão do execution-plan necessária
- ICE Score do ciclo planejado era alto, mas o resultado real ficou abaixo: sinal de **overestimation de Confidence**
- Recomendação: reduzir escopo dos próximos domínios para garantir ciclos menores e mais rápidos`
    : `- Growth loops **funcionando**: todos os domínios passaram
- North Star Metric do ciclo provavelmente atingida — manter a cadência
- Oportunidade: aumentar ICE Score do próximo ciclo planejando experiments de maior impacto`
}

### 🧠 Matt Mochary — CEO OS Lens
${
  data.context?.bottleneck
    ? `- **Gargalo de decisão detectado:** "${data.context.bottleneck}" está bloqueando o fluxo
- Energy drain: decisões não tomadas acumulam "dívida de atenção" que degrada todos os outputs seguintes
- Feedback loop entre Admin e Engineering possivelmente **quebrado** — context.json não está servindo como contrato suficiente
- Ação imediata: resolver a decisão bloqueante ANTES de iniciar o próximo ciclo`
    : `- Nenhum gargalo de decisão explícito detectado no context.json
- Feedback loop entre departamentos **aparentemente funcional**
- Monitorar: ciclos futuros com mais de 3 domínios planejados aumentam risco de gargalo de decisão`
}

### 🔄 Brian Balfour — Systems Fit Lens
- Taxa de conclusão ${totalPlanned > 0 ? Math.round((passCount / totalPlanned) * 100) : 0}% indica ${passCount / Math.max(totalPlanned, 1) >= 0.8 ? "**bom fit** entre modelo e execução" : "**desalinhamento** entre model fit e channel fit — o processo de execução não está encaixado com o tipo de tarefa"}
- ${data.manifests.length} artefatos produzidos para ${reflections.length} domínios executados — ratio de ${reflections.length > 0 ? (data.manifests.length / reflections.length).toFixed(1) : "N/A"} artefatos/domain
- Retenção de outputs: ${data.manifests.length < reflections.length ? "artefatos insuficientes para alimentar o próximo ciclo com contexto adequado" : "boa cobertura de artefatos por domain"}

### 🌐 Darren Murph — Async Friction Lens
- ${data.context ? "context.json presente" : "⚠️ context.json ausente"} — ${data.context ? "handoff documentado" : "handoff implícito detectado"}
- ${data.contextPack ? "context-pack.json presente — domains documentados" : "⚠️ context-pack.json ausente — risco de execução sem contexto suficiente"}
- Friction async: qualquer domain que falhou **provavelmente dependeu de contexto não escrito** — handbook-first falhou nesses pontos
- Recomendação: cada domain deve ter seu próprio context.json parcial antes de ser executado

---

## Conclusão da Análise

**Top gargalo identificado:** ${bottlenecks[0]?.name || "N/A"}
**ICE Score:** ${bottlenecks[0]?.ice || "N/A"}
**Tipo:** ${bottlenecks[0]?.type || "N/A"}
**Causa raiz:** ${bottlenecks[0]?.rootCause || "N/A"}

---
*Gerado automaticamente pelo Department of Flow Intelligence — One Agent Corp v4.2*
`;

  const reportPath = path.join(FLOW_OUTPUT, "bottleneck-report.md");
  fs.writeFileSync(reportPath, report, "utf-8");
  console.log(`\n  📄 bottleneck-report.md → ${reportPath}`);
  return report;
}

function writeGrowthActions(actions: AcidAction[]) {
  ensureDir(FLOW_OUTPUT);

  const actionsText = actions
    .map(
      (a, i) => `### Ação ${i + 1} — ${a.bottleneck} (ICE: ${a.ice})

- **Ação:** ${a.action}
- **Contexto:** ${a.context}
- **Indicador:** ${a.indicator}
- **Deadline:** ${a.deadline}`
    )
    .join("\n\n---\n\n");

  const report = `# Growth Actions — Próximo Ciclo
**Gerado por:** Department of Flow Intelligence
**Timestamp:** ${timestamp()}
**Projeto:** ${PROJECT_ID}
**Baseado em:** flow/bottleneck-report.md

---

## Top ${actions.length} Ações ACID

${actionsText}

---

## Síntese do Board

### Consenso entre os Consultores
Todos os consultores concordam que **a velocidade do ciclo é a North Star Metric da fábrica**. Qualquer gargalo que reduza a velocidade de hipótese → teste → resultado é o inimigo número 1, independente do tipo (técnico, decisão, comunicação ou delegação).

### Tensões Produtivas
- **Ellis vs. Mochary:** Ellis quer ciclos menores e mais rápidos (experimentos); Mochary quer decisões mais claras antes de começar. Tensão real: decisões bem feitas aceleram, mas demoram.
- **Balfour vs. Murph:** Balfour foca em retenção de sistema (reusar artefatos); Murph foca em eliminar atrito de comunicação. Tensão real: documentar mais pode criar mais atrito.

### Pergunta-Chave para o Próximo Ciclo
**"O que estou assumindo sobre este ciclo que, se estivesse errado, mudaria completamente o plano?"**
*(Se a resposta for mais de 1 coisa, o ciclo está mal planejado.)*

---
*Gerado automaticamente pelo Department of Flow Intelligence — One Agent Corp v4.2*
`;

  const actionsPath = path.join(FLOW_OUTPUT, "growth-actions.md");
  fs.writeFileSync(actionsPath, report, "utf-8");
  console.log(`  📄 growth-actions.md → ${actionsPath}`);
  return report;
}

function writeFlowReflection(bottlenecks: Bottleneck[], actions: AcidAction[], data: ReturnType<typeof ingestCycleData>) {
  ensureDir(path.join(SWARM_TREE, "reflections"));

  const reflection = {
    domain: "flow-intelligence",
    timestamp: timestamp(),
    project: PROJECT_ID,
    verdict: bottlenecks.length > 0 && bottlenecks[0].ice > 100 ? "fail" : "pass",
    bottlenecks_found: bottlenecks.length,
    top_bottleneck: bottlenecks[0]?.name || "none",
    top_bottleneck_ice: bottlenecks[0]?.ice || 0,
    top_bottleneck_type: bottlenecks[0]?.type || "none",
    actions_generated: actions.length,
    minds_consulted: ["sean_ellis", "matt_mochary", "brian_balfour", "darren_murph"],
    reserves_activated: [] as string[],
    meta_learning: `Ciclo analisado com ${data.reflections.filter(r => r.verdict === "pass").length}/${data.contextPack?.domains?.length || data.reflections.length} domínios concluídos. Principal gargalo: ${bottlenecks[0]?.type || "nenhum"}. A fábrica aprende: gargalos do tipo "${bottlenecks[0]?.type || "sistema"}" tendem a se repetir se não endereçados na raiz.`,
    next_cycle_priority: actions[0]?.action || "Iniciar próximo ciclo sem gargalos identificados",
  };

  const reflectionPath = path.join(SWARM_TREE, "reflections", "flow-reflection.json");
  fs.writeFileSync(reflectionPath, JSON.stringify(reflection, null, 2), "utf-8");
  console.log(`  📄 flow-reflection.json → ${reflectionPath}`);

  // Atualiza context.json com bottleneck e next_cycle_priority
  const contextPath = path.join(WORKSPACE, "context.json");
  if (fs.existsSync(contextPath)) {
    const ctx = readJson<ContextJson>(contextPath) || {};
    ctx.bottleneck = bottlenecks[0]?.rootCause || ctx.bottleneck || null;
    ctx.next_cycle_priority = actions[0]?.action || null;
    ctx.last_flow_analysis = timestamp();
    fs.writeFileSync(contextPath, JSON.stringify(ctx, null, 2), "utf-8");
    console.log(`  🔄 context.json atualizado com bottleneck + next_cycle_priority`);
  }

  return reflection;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║   Department of Flow Intelligence — Swarm OS     ║");
  console.log("║   Análise de Gargalos & Aceleração de Ciclos     ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log(`\n🎯 Projeto: ${PROJECT_ID}`);
  console.log(`📋 Spec: ${DEPT_SPEC}`);

  // Fase 1: Ingestão
  const data = ingestCycleData();

  // Fase 2: Análise de Gargalos
  console.log("\n🔍 [Flow Intelligence] Analisando gargalos...");
  const bottlenecks = analyzeBottlenecks(data);
  console.log(`  ✓ ${bottlenecks.length} gargalos identificados e rankeados por ICE`);

  // Top 3
  console.log("\n📊 Top 3 Gargalos (ICE Score):");
  bottlenecks.slice(0, 3).forEach((b) => {
    console.log(`  ${b.rank}. [ICE: ${b.ice}] ${b.name} (${b.type})`);
  });

  // Fase 3: Gerar Ações ACID
  console.log("\n⚡ [Flow Intelligence] Gerando ações ACID...");
  const actions = generateAcidActions(bottlenecks);

  // Fase 4: Escrever Outputs
  console.log("\n💾 [Flow Intelligence] Escrevendo outputs...");
  writeBottleneckReport(bottlenecks, data);
  writeGrowthActions(actions);
  const jsonPayload = writeGrowthActionsJson(bottlenecks, actions, data);
  const reflection = writeFlowReflection(bottlenecks, actions, data);
  void jsonPayload;

  // Sumário Final
  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║   ✅ Flow Intelligence — Análise Concluída        ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log(`\n  Verdict: ${reflection.verdict.toUpperCase()}`);
  console.log(`  Top Gargalo: ${reflection.top_bottleneck}`);
  console.log(`  ICE Score: ${reflection.top_bottleneck_ice}`);
  console.log(`  Próxima Ação: ${actions[0]?.action?.substring(0, 80)}...`);
  console.log(`\n  📁 Outputs em: workspace/${PROJECT_ID}/flow/`);
  console.log(`  📁 Reflection em: .swarm-tree/reflections/flow-reflection.json\n`);
}

main().catch((e) => {
  console.error("❌ Erro no Department of Flow Intelligence:", e);
  process.exit(1);
});
