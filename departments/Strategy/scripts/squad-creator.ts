/**
 * squad-creator.ts
 * Implementação da lógica Nirvana/AIOX para criação de novos squads
 */

import * as fs from "fs";
import * as path from "path";

const BASE_STRUCTURE = ["agents", "checklists", "data", "scripts", "tasks", "templates", "workflows"];

export function createSquad(dept: string, squadName: string) {
  const squadPath = path.join(process.cwd(), "departments", dept, squadName);
  
  if (fs.existsSync(squadPath)) {
    console.log(`⚠️ Squad ${squadName} já existe em ${dept}.`);
    return;
  }

  console.log(`🏗️ Criando Squad: ${squadName} no Departamento: ${dept}...`);

  BASE_STRUCTURE.forEach(folder => {
    fs.mkdirSync(path.join(squadPath, folder), { recursive: true });
  });

  // Cria o gate inicial
  fs.writeFileSync(
    path.join(squadPath, "checklists", "gate.md"),
    `# Gate: ${squadName}\n- [ ] Contexto Validado\n- [ ] Scripts Prontos`
  );

  // Cria o workflow principal em TS
  fs.writeFileSync(
    path.join(squadPath, "workflows", "main.ts"),
    `console.log("Iniciando Squad ${squadName}...");`
  );

  console.log(`✅ Squad ${squadName} estruturado com sucesso.`);
}

// CLI Execution
const [,, dept, name] = process.argv;
if (dept && name) {
  createSquad(dept, name);
}
