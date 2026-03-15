import { execa } from "execa";
import * as path from "path";

async function runTrafficFlow() {
  const project = process.argv.find(a => a.startsWith("--project="))?.split("=")[1] || "default";
  const scriptsPath = path.resolve(__dirname, "../scripts");

  console.log(`\n🚀 [TRAFFIC-FLOW] Iniciando motor de crescimento para: ${project}`);

  try {
    console.log("Step 1: Prospecting Engine...");
    await execa("npx", ["tsx", path.join(scriptsPath, "prospecting-engine.ts"), `--project=${project}`], { stdio: "inherit" });

    console.log("Step 2: Content Inbound Factory...");
    await execa("npx", ["tsx", path.join(scriptsPath, "content-inbound-factory.ts"), `--project=${project}`], { stdio: "inherit" });

    console.log("✅ [TRAFFIC-FLOW] Pipeline de Growth concluída.");
  } catch (err) {
    console.error("❌ Falha no workflow de tráfego.");
    process.exit(1);
  }
}

runTrafficFlow();
