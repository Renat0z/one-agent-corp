import { execa } from "execa";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runAuditFlow() {
  const project = process.argv.find(a => a.startsWith("--project="))?.split("=")[1] || "default";
  const scriptsPath = path.resolve(__dirname, "../scripts");

  console.log(`\n🕵️ [AUDIT-FLOW] Iniciando Auditoria: ${project}`);

  try {
    console.log("Step 1: Auto Audit (Tech Integrity)...");
    await execa("npx", ["tsx", path.join(scriptsPath, "auto-audit.ts"), `--project=${project}`], { stdio: "inherit" });

    console.log("Step 2: Cost Tracker (FinOps)...");
    await execa("npx", ["tsx", path.join(scriptsPath, "cost-tracker.ts"), `--project=${project}`], { stdio: "inherit" });

    console.log("✅ [AUDIT-FLOW] Auditoria concluída.");
  } catch (err) {
    console.error("❌ Falha no workflow de Auditoria.");
    process.exit(1);
  }
}

runAuditFlow();
