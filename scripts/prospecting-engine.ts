import { createAgentSession, SessionManager } from '@mariozechner/pi-coding-agent';

async function runProspecting() {
  const { session } = await createAgentSession({
    sessionManager: SessionManager.inMemory(),
  });

  const prompt = `
Você é o Head of Sales da One Agent Corp.
O produto é o Auditor de Hemorragia Financeira: https://web-pearl-five-63.vercel.app

MISSÃO: Gerar uma lista de ALVOS REAIS e MENSAGENS CUSTOMIZADAS.

1. PESQUISA REDDIT:
Identifique 3 threads famosas ou recentes em r/PPC ou r/Shopify que falam sobre desperdício de anúncios.
Para cada uma, gere uma resposta "Sniper" que não pareça spam.

2. LISTA DE AGÊNCIAS (ALVOS):
Liste 5 categorias de agências ou nomes reais de agências Shopify (ex: WeMakeWebsites, BVACCEL, agências BR como Driven) 
e o motivo pelo qual o ProfitBridge é o "cavalo de troia" perfeito para elas entrarem no cliente.

3. MENSAGEM HORMORZI (SHORT-FORM):
Gere 3 versões de mensagens para enviar via DM ou Chat que levam menos de 10 segundos para ler.
`;

  console.log('🎯 Iniciando Motor de Prospecção (Sniper Mode)...');
  session.subscribe((event: any) => {
    if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
      process.stdout.write(event.assistantMessageEvent.delta);
    }
  });

  await session.prompt(prompt);
}

runProspecting();
