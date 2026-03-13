import { createAgentSession, SessionManager } from '@mariozechner/pi-coding-agent';
import { readFile, appendFile } from 'fs/promises';
import path from 'path';

async function reflect() {
  console.log('🧠 Iniciando Reflexão de Ciclo (Process Evolution)...');

  const reportPath = path.join(process.cwd(), 'projects', 'stage0-research', 'FULL-REPORT.md');
  const report = await readFile(reportPath, 'utf-8');

  const { session } = await createAgentSession({
    sessionManager: SessionManager.inMemory(),
  });

  console.log('🤖 Analisando qualidade do último Stage 0...');

  const prompt = `
Você é o Chief Process Officer da One Agent Corp.
Analise o relatório do Stage 0 abaixo e identifique:
1. Onde o processo foi superficial?
2. O modelo alucinou ou foi otimista demais em algum ponto?
3. A oferta gerada segue REALMENTE Alex Hormozi (10x valor, risco zero)?
4. Que instrução específica devemos adicionar ao script scripts/stage0-next-project.ts para que o próximo ciclo seja melhor?

RELATÓRIO:
${report.slice(0, 10000)}
`;

  let analysis = '';
  session.subscribe((event: any) => {
    if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
      analysis += event.assistantMessageEvent.delta;
    }
  });

  await session.prompt(prompt);

  const evolutionEntry = `
### Ciclo em ${new Date().toLocaleDateString('pt-BR')}
**Análise de Qualidade:**
${analysis}

---
`;

  await appendFile(path.join(process.cwd(), 'PROCESS_EVOLUTION.md'), evolutionEntry);
  console.log('\n✅ Reflexão concluída e salva em PROCESS_EVOLUTION.md');
}

reflect().catch(console.error);
