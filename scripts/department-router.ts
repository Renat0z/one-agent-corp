/**
 * department-router.ts
 * Acionador central dos departamentos da One Agent Corp v11
 */

import { execa } from "execa";
import * as path from "path";

const DEPARTMENTS_ROOT = path.resolve(process.cwd(), "departments");

export async function runDepartmentTask(dept: string, squad: string, task: string, project: string) {
  const scriptPath = path.join(DEPARTMENTS_ROOT, dept, "workflows", `${task}.ts`);
  
  console.log(`\n🏢 [DEPT: ${dept.toUpperCase()}] [SQUAD: ${squad}]`);
  console.log(`⚡ Executing: ${task}...`);

  try {
    await execa("npx", ["tsx", scriptPath, `--project=${project}`], { stdio: "inherit" });
    console.log(`✅ ${task} concluded.`);
  } catch (err) {
    console.error(`❌ Failed to execute ${task} in ${dept}.`);
    throw err;
  }
}

// Se rodado diretamente, serve como o "Squad Creator" CLI
if (import.meta.url.endsWith(process.argv[1])) {
  const args = process.argv.slice(2);
  const action = args[0]; // e.g. "create-squad"
  
  if (action === "create-squad") {
    // Lógica para instanciar a estrutura de pastas baseada no squad-creator.md
    console.log("🛠️ Squad Creator Agent acionado via TS...");
  }
}
