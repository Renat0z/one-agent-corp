import { execa } from "execa";
import * as path from "path";

async function runScoutFlow() {
  const project = process.argv.find(a => a.startsWith("--project="))?.split("=")[1] || "default";
  const scriptsPath = path.resolve(__dirname, "../scripts");

  console.log(`\n🔍 [SCOUT-FLOW] Iniciando Inteligência de Mercado: ${project}`);

  try {
    console.log("Step 1: Market Scout (Niche discovery)...");
    await execa("npx", ["tsx", path.join(scriptsPath, "market-scout.ts"), `--project=${project}`], { stdio: "inherit" });

    console.log("Step 2: Market Benchmarking (Metrics)...");
    await execa("npx", ["tsx", path.join(scriptsPath, "market-scout-benchmarking.ts"), `--project=${project}`], { stdio: "inherit" });

    console.log("Step 3: Market Agencies (Distribution mapping)...");
    await execa("npx", ["tsx", path.join(scriptsPath, "market-scout-agencies.ts"), `--project=${project}`], { stdio: "inherit" });

    console.log("✅ [SCOUT-FLOW] Inteligência de Mercado concluída.");
  } catch (err) {
    console.error("❌ Falha no workflow de Scout.");
    process.exit(1);
  }
}

runScoutFlow();
