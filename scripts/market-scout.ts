import { createAgentSession, SessionManager } from '@mariozechner/pi-coding-agent';
import * as fs from 'fs';
import * as path from 'path';

async function scout() {
  const { session } = await createAgentSession({
    sessionManager: SessionManager.inMemory(),
  });

  const persona = fs.readFileSync(path.join(process.cwd(), 'agents', 'analyst.md'), 'utf-8');

  const prompt = `
${persona}

Sua missão específica agora é validar a existência da dor do ProfitBridge AI (Ads vs Estoque) em dados reais da internet.
Siga RIGOROSAMENTE as diretrizes de ALTA DENSIDADE da sua persona.

PESQUISA ALVO:
1. Reddit (r/shopify, r/PPC, r/ecommerce): Busque por termos como "stop ads out of stock", "google ads inventory sync", "shopify ads profit margin".
2. Shopify App Store: Busque por reviews negativas de competidores (Revealbot, TripleWhale) focadas em "lack of inventory sync".
3. Google Ads Community: Problemas com scripts de "inventory-based bidding".

SAÍDA ESPERADA (OBRIGATÓRIO FORMATO MARKDOWN):
- Evidências: Liste pelo menos 3 "sentenças reais" que usuários dizem em fóruns que provam a dor.
- Estratégia de Distribuição: Onde estão os grupos de WhatsApp/Slack de "Dunning" ou "Media Buyers" onde podemos lançar um Beta?
- Lead Magnet de Teste: Que ferramenta gratuita (além da calculadora) faria um dono de e-commerce nos dar acesso à API?
`;

  console.log('🔍 Iniciando Market Scout (Simulação de Crawling e Inteligência)...');
  let fullResponse = "";
  session.subscribe((event: any) => {
    if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
      const delta = event.assistantMessageEvent.delta;
      process.stdout.write(delta);
      fullResponse += delta;
    }
  });

  await session.prompt(prompt);

  // Persistence for Pipeline Gates
  const reportDir = path.join(process.cwd(), 'workspace', 'profitbridge', 'reports', 'market');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  const reportPath = path.join(reportDir, 'market-scout-report.md');
  fs.writeFileSync(reportPath, fullResponse);
  console.log(`\n✅ Relatório salvo em: ${reportPath}`);
}

scout();
