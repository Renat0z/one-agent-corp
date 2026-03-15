/**
 * prospecting-engine.ts
 * One Agent Corp — Sales / Growth Department
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const cliArgs = process.argv.slice(2);
const projectArg = (cliArgs.find((a) => a.startsWith("--project=")) || "--project=saas-csm").replace("--project=", "");
const WORKSPACE = path.join(ROOT, "workspace", projectArg);

async function main() {
  console.log(`\n🎯 [PROSPECTING] Gerando scripts de abordagem para: ${projectArg}`);

  const agenciesPath = path.join(WORKSPACE, "reports", "sales", "top-50-agencies-prospecting.json");
  if (!fs.existsSync(agenciesPath)) {
    console.error("❌ Erro: Lista de agências não encontrada. Rode market-agencies primeiro.");
    process.exit(1);
  }

  const { agencies } = JSON.parse(fs.readFileSync(agenciesPath, "utf-8"));
  
  const outreachPlan = agencies.map((agency: any) => ({
    agency: agency.name,
    target: "Head of Partnerships / CEO",
    platform: "LinkedIn / Email",
    script: `Olá, vi que a ${agency.name} é referência em ${agency.focus}. Criei um Auditor de Churn que ajuda agências SaaS a provarem o ROI de retenção em 2 minutos. Adoraria mostrar como vocês podem usar isso para reduzir o churn dos seus clientes (e aumentar o LTV da agência) sem custo extra. Topa um check de 5 min?`
  }));

  const reportDir = path.join(WORKSPACE, "reports", "sales");
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });

  const outputPath = path.join(reportDir, "outreach-scripts.json");
  fs.writeFileSync(outputPath, JSON.stringify(outreachPlan, null, 2));

  console.log(`✅ [PROSPECTING] ${outreachPlan.length} scripts de abordagem personalizados gerados.`);
  console.log(`📂 Arquivo: ${path.relative(ROOT, outputPath)}`);
}

main().catch(console.error);
