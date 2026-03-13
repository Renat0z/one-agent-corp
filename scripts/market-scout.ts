import { createAgentSession, SessionManager } from '@mariozechner/pi-coding-agent';

async function scout() {
  const { session } = await createAgentSession({
    sessionManager: SessionManager.inMemory(),
  });

  const prompt = `
Você é o Head of Market Intelligence da One Agent Corp.
Sua missão é validar a existência da dor do ProfitBridge AI (Ads vs Estoque) em dados reais da internet.

PESQUISA ALVO:
1. Reddit (r/shopify, r/PPC, r/ecommerce): Busque por termos como "stop ads out of stock", "google ads inventory sync", "shopify ads profit margin".
2. Shopify App Store: Busque por reviews negativas de competidores (Revealbot, TripleWhale) focadas em "lack of inventory sync".
3. Google Ads Community: Problemas com scripts de "inventory-based bidding".

SAÍDA ESPERADA:
- Evidências: Liste pelo menos 3 "sentenças reais" que usuários dizem em fóruns que provam a dor.
- Estratégia de Distribuição: Onde estão os grupos de WhatsApp/Slack de "Dunning" ou "Media Buyers" onde podemos lançar um Beta?
- Lead Magnet de Teste: Que ferramenta gratuita (além da calculadora) faria um dono de e-commerce nos dar acesso à API?
`;

  console.log('🔍 Iniciando Market Scout (Simulação de Crawling e Inteligência)...');
  session.subscribe((event: any) => {
    if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
      process.stdout.write(event.assistantMessageEvent.delta);
    }
  });

  await session.prompt(prompt);
}

scout();
