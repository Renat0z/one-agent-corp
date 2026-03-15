import { createAgentSession, SessionManager, AuthStorage, ModelRegistry } from '@mariozechner/pi-coding-agent';
import { getModel } from '@mariozechner/pi-ai';
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';

async function generatePRD() {
  const projectId = "proj-mmnemavv-0001";
  const outputDir = path.join(process.cwd(), 'projects', projectId, 'stage1-ideation');
  const stage0ReportPath = path.join(process.cwd(), 'projects', 'stage0-research', 'FULL-REPORT.md');
  
  console.log(`🚀 Gerando PRD Técnico para o projeto: ${projectId}`);
  
  const stage0Report = await readFile(stage0ReportPath, 'utf-8');

  const authStorage = AuthStorage.create();
  const modelRegistry = new ModelRegistry(authStorage);
  const model = getModel('google', 'gemini-3-flash-preview');

  const { session } = await createAgentSession({
    sessionManager: SessionManager.inMemory(),
    model: model || undefined,
    authStorage,
    modelRegistry
  });

  const persona = await readFile(path.join(process.cwd(), 'agents', 'pm.md'), 'utf-8');

  const prdPrompt = `
${persona}

Baseado na análise de Stage 0 anexa, gere o **PRD Técnico (Product Requirements Document)** do projeto **ProfitBridge AI**.
Siga RIGOROSAMENTE as diretrizes de ALTA DENSIDADE da sua persona.

### REQUISITOS DE SAÍDA CRÍTICOS:
- Sua resposta deve ser APENAS o conteúdo do arquivo Markdown.
- Comece imediatamente com "# PRD TÉCNICO".
- Use tabelas, listas e muitos dados numéricos.
- NÃO escreva "Aqui está o PRD" ou qualquer introdução.

### ESTRUTURA DO PRD:
1. **Visão Geral & "Mecanismo Único":** Como exatamente a integração Shopify <-> Google Ads funciona para salvar lucro.
2. **User Stories (Hormozi Style):** Focado no dono do e-commerce e no gestor de tráfego.
3. **Arquitetura Técnica:**
   - Fluxo de Dados (Webhooks de estoque -> Engine de Decisão -> API de Lances).
   - Definição do Buffer de Estoque (Safe Threshold).
4. **Funcionalidades Core (MVP):**
   - Importador de Skus.
   - Calculadora de Margem Dinâmica.
   - O "Kill Switch" (Pausa de anúncios).
5. **Roadmap de 8 CICLOS:** O que será entregue e validado em cada ciclo.
6. **Definição de Pronto (DoR/DoD):** Critérios de sucesso para o MVP.

ANÁLISE DE STAGE 0:
${stage0Report.slice(0, 8000)}
`;

  console.log('🤖 Processando PRD com Gemini...');
  
  let prdContent = '';
  session.subscribe((event: any) => {
    if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
      const delta = event.assistantMessageEvent.delta;
      process.stdout.write(delta);
      prdContent += delta;
    }
  });

  await session.prompt(prdPrompt);

  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, 'PRD.md'), prdContent);
  
  // 🔗 LINK DE COMPATIBILIDADE PARA O WORKSPACE (GATE-KEEPER)
  const workspacePath = path.join(process.cwd(), 'workspace', 'saas-csm', 'reports');
  await mkdir(workspacePath, { recursive: true });
  await writeFile(path.join(workspacePath, 'prd-tecnico.md'), prdContent);
  
  console.log(`\n\n✅ PRD gerado com sucesso em: projects/${projectId}/stage1-ideation/PRD.md`);
}

generatePRD().catch(console.error);
