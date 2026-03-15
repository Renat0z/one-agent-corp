import { execa } from "execa";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runBuildFlow() {
  const project = process.argv.find(a => a.startsWith("--project="))?.split("=")[1] || "default";
  const scriptsPath = path.resolve(__dirname, "../scripts");

  console.log(`\n🏗️ [BUILD-FLOW] Iniciando Engenharia: ${project}`);

  try {
    console.log("Step 1: Generating PRD...");
    await execa("npx", ["tsx", path.join(scriptsPath, "generate-prd.ts"), `--project=${project}`], { stdio: "inherit" });

    console.log("Step 2: Deploying Full Stack (Dry Run/Production)...");
    await execa("npx", ["tsx", path.join(scriptsPath, "deploy-full-stack.ts"), `--project=${project}`], { stdio: "inherit" });

    console.log("✅ [BUILD-FLOW] Engenharia concluída.");
  } catch (err) {
    console.error("❌ Falha no workflow de Build.");
    process.exit(1);
  }
}

runBuildFlow();
