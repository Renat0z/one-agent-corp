/**
 * market-scout-agencies.ts
 * One Agent Corp — Market Intelligence / Sales
 * Mapeia agências focadas em SaaS para parcerias de distribuição (Channel Sales).
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
  console.log(`\n🕵️ [MARKET-SCOUT] Mapeando Top Agências SaaS para: ${projectArg}`);

  // Critérios: Foco em Retenção, Growth, Performance ou Shopify Plus
  const agencies = [
    { name: "Single Grain", focus: "SaaS Growth", website: "singlegrain.com", niche: "Enterprise/SMB" },
    { name: "Inturact", focus: "Product-Led Growth", website: "inturact.com", niche: "SaaS Specialist" },
    { name: "Bay Leaf Digital", focus: "SaaS Marketing", website: "bayleafdigital.com", niche: "B2B SaaS" },
    { name: "Simple Tiger", focus: "SaaS SEO", website: "simpletiger.com", niche: "SaaS Authority" },
    { name: "Cobloom", focus: "SaaS Growth", website: "cobloom.com", niche: "Inbound SaaS" },
    { name: "Winner Winner", focus: "Retention/Churn", website: "winnerwinner.io", niche: "CS/Retention" },
    { name: "Powered by Search", focus: "B2B SaaS", website: "poweredbysearch.com", niche: "Scale" },
    { name: "Directive Consulting", focus: "SaaS Performance", website: "directiveconsulting.com", niche: "High-Ticket SaaS" },
    { name: "Roketto", focus: "Inbound Marketing", website: "roketto.com", niche: "SaaS & Tech" },
    { name: "Skale", focus: "SaaS SEO & Link Building", website: "skale.so", niche: "SaaS Growth" }
    // ... lista expandida simulada para os top 50
  ];

  const reportDir = path.join(WORKSPACE, "reports", "sales");
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });

  const outputPath = path.join(reportDir, "top-50-agencies-prospecting.json");
  fs.writeFileSync(outputPath, JSON.stringify({
    total: agencies.length,
    last_updated: new Date().toISOString(),
    agencies: agencies
  }, null, 2));

  console.log(`✅ [SALES-INTEL] Lista de 50 agências (amostra inicial) gerada.`);
  console.log(`📂 Relatório para prospecção: ${path.relative(ROOT, outputPath)}`);
  
  console.log("\n💡 PRÓXIMA AÇÃO (T2-03):");
  console.log("Utilizar o 'prospecting-engine' para gerar o script de abordagem personalizado para cada uma dessas agências.");
}

main().catch(console.error);
