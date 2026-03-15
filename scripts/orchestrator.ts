/**
 * orchestrator.ts
 * One Agent Corp v10.1 — Enterprise Department Orchestrator
 */

import * as fs   from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { execa }         from "execa";
import { GateKeeper }    from "./gate-keeper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const ROOT       = path.resolve(__dirname, "..");

type ChainName = "flow" | "audit" | "full" | "stage0" | "deploy" | "cycle" | "project" | "traction" | "conversion" | "all";

interface ScriptNode {
  id:           string;
  script:       string;
  description:  string;
  department:   "Strategy" | "Product" | "MarketIntelligence" | "Growth" | "Engineering" | "QA/Audit" | "Operations";
  dependencies: string[];
  chains:       ChainName[];
  args?:        string[];
}

// ─── Script Registry ──────────────────────────────────────────────────────────

const REGISTRY: ScriptNode[] = [
  // ── Market Intelligence ─────────────────────────────────────────────────────
  {
    id:           "market-scout",
    department:   "MarketIntelligence",
    script:       "scripts/market-scout.ts",
    description:  "Análise de mercado e oportunidades de nicho",
    dependencies: [],
    chains:       ["stage0", "traction", "all"],
  },
  {
    id:           "market-benchmarking",
    department:   "MarketIntelligence",
    script:       "scripts/market-scout-benchmarking.ts",
    description:  "Coleta de métricas reais (Churn, LTV) para autoridade",
    dependencies: ["market-scout"],
    chains:       ["traction", "all"],
  },
  {
    id:           "market-agencies",
    department:   "MarketIntelligence",
    script:       "scripts/market-scout-agencies.ts",
    description:  "Mapeia agências parceiras para distribuição de MRR",
    dependencies: ["market-scout"],
    chains:       ["traction", "all"],
  },

  // ── Strategy ───────────────────────────────────────────────────────────────
  {
    id:           "strategy-review",
    department:   "Strategy",
    script:       "scripts/strategy-review.ts",
    description:  "Aprovação do plano de ação e GTM",
    dependencies: ["market-scout"],
    chains:       ["flow", "full", "all"],
  },
  {
    id:           "consult-council",
    department:   "Strategy",
    script:       "scripts/consult-council.ts",
    description:  "Consulta mentes estratégicas (Dalio, Ries) sobre o projeto",
    dependencies: [],
    chains:       ["cycle", "traction", "all"],
  },

  // ── Product ────────────────────────────────────────────────────────────────
  {
    id:           "generate-prd",
    department:   "Product",
    script:       "scripts/generate-prd.ts",
    description:  "Geração do PRD e User Stories",
    dependencies: ["market-scout"],
    chains:       ["stage0", "cycle", "all"],
  },

  // ── Growth ─────────────────────────────────────────────────────────────────
  {
    id:           "prospecting-engine",
    department:   "Growth",
    script:       "scripts/prospecting-engine.ts",
    description:  "Identifica leads e comunidades para distribuição",
    dependencies: ["market-benchmarking"],
    chains:       ["traction", "all"],
  },
  {
    id:           "content-inbound-factory",
    department:   "Growth",
    script:       "scripts/content-inbound-factory.ts",
    description:  "Criação de posts e threads de alta conversão",
    dependencies: ["consult-council", "market-benchmarking"],
    chains:       ["traction", "all"],
  },

  // ── Engineering ────────────────────────────────────────────────────────────
  {
    id:           "lead-magnet-creator",
    department:   "Engineering",
    script:       "scripts/lead-magnet-creator.ts",
    description:  "Desenvolvimento de ferramentas técnicas de conversão",
    dependencies: ["market-benchmarking"],
    chains:       ["conversion", "all"],
  },
  {
    id:           "deploy-full-stack",
    department:   "Engineering",
    script:       "scripts/deploy-full-stack.ts",
    description:  "Deploy da infraestrutura em produção",
    dependencies: [],
    chains:       ["deploy", "all"],
  },

  // ── QA / Audit ─────────────────────────────────────────────────────────────
  {
    id:           "auto-audit",
    department:   "QA/Audit",
    script:       "scripts/auto-audit.ts",
    description:  "Validação de integridade técnica e de custos",
    dependencies: [],
    chains:       ["audit", "full", "all"],
  },
  {
    id:           "funnel-optimizer",
    department:   "QA/Audit",
    script:       "scripts/funnel-optimizer.ts",
    description:  "Auditoria de taxas de conversão e gargalos",
    dependencies: [],
    chains:       ["conversion", "all"],
  },

  // ── Operations ─────────────────────────────────────────────────────────────
  {
    id:           "action-executor",
    department:   "Operations",
    script:       "scripts/action-executor.ts",
    description:  "Execução final de tarefas e postagens via MCP",
    dependencies: ["content-inbound-factory"],
    chains:       ["flow", "traction", "all"],
  }
];

// ─── Orchestration Logic ──────────────────────────────────────────────────────

const cliArgs    = process.argv.slice(2);
const chainArg   = (cliArgs.find((a) => a.startsWith("--chain="))   || "--chain=flow").replace("--chain=", "");
const projectArg = (cliArgs.find((a) => a.startsWith("--project=")) || "--project=one-agent-corp").replace("--project=", "");
const CHAIN      = chainArg as ChainName;
const PROJECT_ID = projectArg;

async function runNode(node: ScriptNode) {
  console.log(`\n🏢 [DEPT: ${node.department.toUpperCase()}]`);
  console.log(`🚀 Executando: ${node.id} (${node.description})`);
  
  try {
    await execa("node", ["--import", "tsx", node.script, `--project=${PROJECT_ID}`], { cwd: ROOT, stdio: "inherit" });
    
    // 🛡️ GATE-KEEPER: Validação de Qualidade Pós-Execução
    const keeper = new GateKeeper(PROJECT_ID);
    
    // Mapeamento de artefatos por script para auditoria
    const artifactMap: Record<string, string> = {
      "market-scout": "reports/validation-report.md",
      "market-benchmarking": "market-benchmarks.json",
      "generate-prd": "reports/prd-tecnico.md",
      "strategy-review": "strategy/execution-plan.md"
    };

    if (artifactMap[node.id]) {
      const result = keeper.auditFile(artifactMap[node.id]);
      keeper.logAudit(node.id, result);
      
      if (!result.passed) {
        console.error(`🛑 Bloqueio de Pipeline: O output de ${node.id} não atingiu o nível de densidade exigido.`);
        process.exit(1);
      }
    }

    console.log(`✅ ${node.id} — Concluído.`);
  } catch (err: any) {
    console.error(`❌ ${node.id} — Falhou.`);
    process.exit(1);
  }
}

async function main() {
  const selected = REGISTRY.filter(n => n.chains.includes(CHAIN));
  if (selected.length === 0) {
    console.error(`Chain ${CHAIN} não encontrada.`);
    process.exit(1);
  }

  // Ordenação simples por dependência (neste exemplo linear ou via ID)
  // Para brevidade, executaremos na ordem do REGISTRY respeitando o filtro
  console.log(`\n╔══════════════════════════════════════════════════════╗`);
  console.log(`║   One Agent Corp — ${CHAIN.toUpperCase()} PIPELINE`);
  console.log(`╚══════════════════════════════════════════════════════╝`);

  for (const node of selected) {
    await runNode(node);
  }
}

main().catch(console.error);
