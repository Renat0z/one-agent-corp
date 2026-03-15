/**
 * auto-audit.ts
 * Department of QA & Audit — Swarm OS v4.2
 *
 * Realiza auditoria técnica automática baseada no Plano de Execução.
 * Suporta verificações mecânicas (arquivos, comandos, padrões de texto).
 *
 * Uso: npx tsx scripts/auto-audit.ts --project={projectId}
 */

import * as fs   from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const cliArgs    = process.argv.slice(2);
const projectArg = cliArgs.find((a) => a.startsWith("--project="));
const PROJECT_ID = projectArg ? projectArg.split("=")[1] : "one-agent-corp";

const ROOT      = path.resolve(__dirname, "..");
const WORKSPACE = path.join(ROOT, "workspace", PROJECT_ID === "one-agent-corp" ? "" : PROJECT_ID);
const PLAN_PATH = path.join(WORKSPACE, "strategy", "execution-plan.md");

interface VerificationResult {
  label:   string;
  status:  "pass" | "fail" | "warn";
  message: string;
}

function runAudit() {
  console.log(`\n🔍 INICIANDO AUTO-AUDITORIA — Projeto: ${PROJECT_ID}`);

  const results: VerificationResult[] = [];

  // 1. Verificar se o Plano de Execução existe
  if (!fs.existsSync(PLAN_PATH)) {
    console.warn(`⚠️  Plano de Execução não encontrado: ${PLAN_PATH}`);
    // Se for o projeto principal, tentamos audit padrão
    if (PROJECT_ID === "one-agent-corp") {
       runStandardAudit(results);
    }
  } else {
    // 2. Parsear Verificações Mecânicas do Plano
    const planContent = fs.readFileSync(PLAN_PATH, "utf-8");
    parseAndRunMechanicalChecks(planContent, results);
  }

  // 3. Reportar Resultados
  console.log("\n📋 RESULTADOS DA AUDITORIA:");
  let hasCriticalFail = false;

  for (const res of results) {
    const icon = res.status === "pass" ? "✅" : res.status === "fail" ? "❌" : "⚠️";
    console.log(`  ${icon} [${res.label}] ${res.message}`);
    if (res.status === "fail") hasCriticalFail = true;
  }

  if (hasCriticalFail) {
    console.error("\n❌ AUDITORIA REPROVADA: Corrija os problemas críticos antes de prosseguir.");
    process.exit(1);
  } else {
    console.log("\n✅ AUDITORIA CONCLUÍDA COM SUCESSO.");
  }
}

function parseAndRunMechanicalChecks(content: string, results: VerificationResult[]) {
  // Procura por blocos de checklist no estilo:
  // - [ ] file: <path>
  // - [ ] cmd: <command>
  // - [ ] text: <regex> in <path>
  
  const lines = content.split("\n");
  let inCriteriaSection = false;

  for (const line of lines) {
    if (line.match(/^#+ .*?(Verification Criteria|Mechanical Verification)/i)) {
      inCriteriaSection = true;
      continue;
    }
    if (inCriteriaSection && line.startsWith("#")) {
       inCriteriaSection = false;
       continue;
    }

    if (inCriteriaSection && line.includes("- [ ]")) {
      const task = line.split("- [ ]")[1].trim();
      
      // Check for file existence
      if (task.startsWith("file:")) {
        const filePath = task.replace("file:", "").trim();
        const absolutePath = path.resolve(ROOT, filePath);
        if (fs.existsSync(absolutePath)) {
          results.push({ label: "FILE_EXISTS", status: "pass", message: `Arquivo encontrado: ${filePath}` });
        } else {
          results.push({ label: "FILE_MISSING", status: "fail", message: `Arquivo obrigatório ausente: ${filePath}` });
        }
      }
      
      // Check for command execution
      else if (task.startsWith("cmd:")) {
        const command = task.replace("cmd:", "").trim();
        try {
          execSync(command, { stdio: "ignore", cwd: ROOT });
          results.push({ label: "CMD_RUN", status: "pass", message: `Comando executado com sucesso: ${command}` });
        } catch (e) {
          results.push({ label: "CMD_FAIL", status: "fail", message: `Falha ao executar comando: ${command}` });
        }
      }

      // Check for text pattern
      else if (task.includes(" in ")) {
         const parts = task.split(" in ");
         const pattern = parts[0].replace("text:", "").trim();
         const filePath = parts[1].trim();
         const absolutePath = path.resolve(ROOT, filePath);

         if (!fs.existsSync(absolutePath)) {
            results.push({ label: "TEXT_CHECK", status: "fail", message: `Arquivo não encontrado para busca: ${filePath}` });
         } else {
            const fileContent = fs.readFileSync(absolutePath, "utf-8");
            if (fileContent.includes(pattern) || new RegExp(pattern).test(fileContent)) {
               results.push({ label: "TEXT_FOUND", status: "pass", message: `Padrão "${pattern}" encontrado em ${filePath}` });
            } else {
               results.push({ label: "TEXT_MISSING", status: "fail", message: `Padrão "${pattern}" não encontrado em ${filePath}` });
            }
         }
      }
      
      // Fallback for general labels
      else {
        results.push({ label: "CHECK", status: "warn", message: `Verificação manual necessária: ${task}` });
      }
    }
  }
}

// Mantendo compatibilidade com auditoria legada se necessário
function runStandardAudit(results: VerificationResult[]) {
  // Exemplo de auditoria de links (legacy profitbridge)
  const legacyPath = path.join(ROOT, 'profitbridge-ai/web/src/app/page.tsx');
  if (fs.existsSync(legacyPath)) {
    const content = fs.readFileSync(legacyPath, 'utf-8');
    if (content.includes('onClick={() => {}}')) {
       results.push({ label: "LEGACY_UI", status: "fail", message: "Handler vazio detectado em page.tsx" });
    }
  }
}

runAudit();
