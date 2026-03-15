/**
 * cost-tracker.ts
 * Department of Flow Intelligence — Monitor de Custos e Tokens
 * Swarm OS v4.2
 *
 * Analisa os arquivos de reflexão (.swarm-tree/reflections/*.json)
 * e gera um relatório consolidado de consumo de tokens e custo estimado.
 *
 * Uso: npx tsx scripts/cost-tracker.ts --project={projectId}
 */

import * as fs   from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const cliArgs    = process.argv.slice(2);
const projectArg = cliArgs.find((a) => a.startsWith("--project="));
const PROJECT_ID = projectArg ? projectArg.split("=")[1] : "one-agent-corp";

const ROOT         = path.resolve(__dirname, "..");
const SWARM_TREE   = path.join(ROOT, ".swarm-tree");
const REFLECTIONS  = path.join(SWARM_TREE, "reflections");
const REPORTS_DIR  = path.join(ROOT, "reports", "costs");

// Tabelas de preço simplificadas (USD por 1M tokens)
const PRICING: Record<string, { input: number; output: number }> = {
  "claude-3-5-sonnet": { input: 3.0, output: 15.0 },
  "claude-3-opus":     { input: 15.0, output: 75.0 },
  "claude-3-haiku":    { input: 0.25, output: 1.25 },
  "gpt-4o":            { input: 5.0, output: 15.0 },
  "gpt-4o-mini":       { input: 0.15, output: 0.60 },
  "default":           { input: 10.0, output: 30.0 }
};

interface Reflection {
  domain?: string;
  node?:   string;
  verdict: string;
  usage?: {
    prompt_tokens:     number;
    completion_tokens: number;
    total_tokens:      number;
    model?:            string;
  };
  timestamp: string;
}

function getPrice(model: string = "default") {
  for (const key in PRICING) {
    if (model.includes(key)) return PRICING[key];
  }
  return PRICING.default;
}

async function main() {
  console.log(`\n📊 Gerando Relatório de Custos para: ${PROJECT_ID}`);

  if (!fs.existsSync(REFLECTIONS)) {
    console.error(`❌ Diretório de reflexões não encontrado: ${REFLECTIONS}`);
    process.exit(1);
  }

  const files = fs.readdirSync(REFLECTIONS).filter(f => f.endsWith(".json"));
  let totalInput = 0;
  let totalOutput = 0;
  let totalCost = 0;

  const domainCosts: Record<string, { input: number; output: number; cost: number }> = {};

  for (const file of files) {
    const content = JSON.parse(fs.readFileSync(path.join(REFLECTIONS, file), "utf-8")) as Reflection;
    if (content.usage) {
      const { prompt_tokens, completion_tokens, model } = content.usage;
      const pricing = getPrice(model);
      
      const inputCost  = (prompt_tokens / 1_000_000) * pricing.input;
      const outputCost = (completion_tokens / 1_000_000) * pricing.output;
      const cost = inputCost + outputCost;

      totalInput += prompt_tokens;
      totalOutput += completion_tokens;
      totalCost += cost;

      const domain = content.domain || "general";
      if (!domainCosts[domain]) domainCosts[domain] = { input: 0, output: 0, cost: 0 };
      domainCosts[domain].input += prompt_tokens;
      domainCosts[domain].output += completion_tokens;
      domainCosts[domain].cost += cost;
    }
  }

  const report = {
    project: PROJECT_ID,
    generated_at: new Date().toISOString(),
    totals: {
      input_tokens: totalInput,
      output_tokens: totalOutput,
      total_tokens: totalInput + totalOutput,
      estimated_cost_usd: totalCost
    },
    by_domain: domainCosts
  };

  if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const reportPath = path.join(REPORTS_DIR, `${PROJECT_ID}-cost-report.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf-8");

  console.log("\n✅ Relatório de Custos Gerado:");
  console.log(`   Tokens Entrada:  ${totalInput.toLocaleString()}`);
  console.log(`   Tokens Saída:    ${totalOutput.toLocaleString()}`);
  console.log(`   Custo Estimado:  $${totalCost.toFixed(4)} USD`);
  console.log(`   Relatório:       reports/costs/${path.basename(reportPath)}`);
}

main().catch(console.error);
