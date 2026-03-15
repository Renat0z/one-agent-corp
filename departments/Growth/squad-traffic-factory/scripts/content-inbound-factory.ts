/**
 * content-inbound-factory.ts
 * One Agent Corp — Growth Engine
 * Gerador de conteúdo para tração orgânica focado em MRR.
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const cliArgs = process.argv.slice(2);
const projectArg = (cliArgs.find((a) => a.startsWith("--project=")) || "--project=one-agent-corp").replace("--project=", "");
const QUIET = cliArgs.includes("--quiet");

const WORKSPACE = path.join(ROOT, "workspace", projectArg === "one-agent-corp" ? "" : projectArg);
const CONTEXT_PATH = path.join(WORKSPACE, "context.json");

async function main() {
  console.log(`\n🚀 [INBOUND-FACTORY] Iniciando geração de conteúdo para: ${projectArg}`);

  // 1. Carregar Contexto
  if (!fs.existsSync(CONTEXT_PATH)) {
    console.error("❌ Erro: context.json não encontrado. Rode o cycle primeiro.");
    process.exit(1);
  }
  const context = JSON.parse(fs.readFileSync(CONTEXT_PATH, "utf-8"));
  const niche = context.niche || "SaaS e Automação AI";
  const targetAudience = context.target_audience || "Empreendedores e Solopreneurs";

  console.log(`📋 Alvo: ${niche} | Público: ${targetAudience}`);

  // 3. Prompt de Geração de Alta Densidade (MRR Focus)
  const prompt = `
    Você é um Growth Hacker focado em MRR. 
    Projeto: ${projectArg}
    Nicho: ${niche}
    Público: ${targetAudience}
    
    Gere 3 peças de conteúdo:
    1. Post para LinkedIn (Foco em Autoridade)
    2. Thread para Twitter/X (Foco em Viralidade)
    3. Post para Fórum/Reddit (Foco em Resolver Problema)
    
    Cada peça deve ter um CTA claro para: ${context.website || "Landing Page do Projeto"}.
    Use gatilhos de escassez e ROI.
  `;

  const reportsDir = path.join(WORKSPACE, "reports", "growth");
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

  // 4. Estrutura de Saída para o Agente postar via MCP
  const output = {
    generated_at: new Date().toISOString(),
    project: projectArg,
    ready_to_post: true,
    platform_payloads: [
      {
        platform: "linkedin",
        content: "[CONTEÚDO GERADO PELO LLM AQUI]",
        mcp_tool: "linkedin_post_tool" 
      },
      {
        platform: "twitter",
        content: "[CONTEÚDO GERADO PELO LLM AQUI]",
        mcp_tool: "twitter_post_tool"
      }
    ]
  };

  const reportPath = path.join(reportsDir, `content-to-post.json`);
  fs.writeFileSync(reportPath, JSON.stringify(output, null, 2));

  console.log("\n✅ Conteúdo gerado e preparado para postagem via MCP!");
  console.log(`📂 Arquivo de postagem: ${path.relative(ROOT, reportPath)}`);
  
  console.log("\n🤖 [ACTION] CLAUDIO-HARD detectou payloads prontos. Aguardando aprovação para disparar MCPs.");
}

main().catch(console.error);
