#!/usr/bin/env -S npx tsx
/**
 * Stage 0 — Job & Offer Validation
 * Pipeline: Trends → Red Team (stress test) → Competitive → Offer → CEO Gate 0
 *
 * O Red Team filtra oportunidades inviáveis ANTES de gastar tempo em competitive/offer.
 * Qualquer ideia que não sobreviva ao stress test é arquivada aqui.
 */

import { createAgentSession, SessionManager, AuthStorage, ModelRegistry } from '@mariozechner/pi-coding-agent';
import { getModel } from '@mariozechner/pi-ai';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT, 'projects', 'stage0-research');

// Configuração do modelo Gemini
const PREFERRED_MODEL = { provider: 'google', id: 'gemini-3-flash-preview' };

const FACTORY_CONTEXT = `
One Agent Corp é uma fábrica virtual de micro-SaaS seguindo os princípios de Alex Hormozi ($100M Offers/Leads).
Foco em: Proposta de Valor 10x, redução de esforço/tempo e maximização da percepção de probabilidade de sucesso.

[PRINCÍPIO DE VELOCIDADE: O CICLO É A UNIDADE]
- Medimos progresso em CICLOS (Hipótese -> Teste -> Resultado -> Decisão).
- O tempo é irrelevante; a velocidade de aprendizado é tudo. 
- Um "Ciclo" pode levar 1 semana, 1 hora ou 1 minuto. O objetivo é maximizar Ciclos/Dia.

[FILTRO DE OBJEÇÃO: ZERO MOAT]
...
`;

// Global session instance
let piSession: any = null;

async function getPiSession() {
  if (!piSession) {
    const authStorage = AuthStorage.create();
    const modelRegistry = new ModelRegistry(authStorage);
    
    // Busca o modelo Gemini configurado
    const model = getModel(PREFERRED_MODEL.provider, PREFERRED_MODEL.id);
    if (!model) {
      console.warn(`⚠️ Modelo ${PREFERRED_MODEL.id} não encontrado. Usando padrão.`);
    }

    const { session } = await createAgentSession({
      sessionManager: SessionManager.inMemory(),
      model: model || undefined,
      authStorage,
      modelRegistry
    });
    piSession = session;
  }
  return piSession;
}

async function callPi(prompt: string, label: string): Promise<string> {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`▶  ${label}`);
  console.log('─'.repeat(60));

  const session = await getPiSession();
  const chunks: string[] = [];

  const unsubscribe = session.subscribe((event: any) => {
    if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
      const delta = event.assistantMessageEvent.delta;
      process.stdout.write(delta);
      chunks.push(delta);
    }
  });

  try {
    await session.prompt(prompt);
  } finally {
    unsubscribe();
  }

  return chunks.join('');
}

async function save(filename: string, content: string): Promise<void> {
  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(path.join(OUTPUT_DIR, filename), content, 'utf-8');
  console.log(`\n✓ Salvo: projects/stage0-research/${filename}`);
}

const NICHES = [
  'Imobiliário High-Ticket', 'Clínicas Médicas Especializadas', 'Agências de SEO/Ads Lean',
  'E-commerce de Nicho (D2C)', 'Recrutamento Tech Especializado', 'Educação Corporativa (LMS)',
  'Logística de Última Milha', 'SaaS para Manufatura Local', 'Gestão de Propriedades (AirBnb)'
];

async function main(): Promise<void> {
  const randomNiche = NICHES[Math.floor(Math.random() * NICHES.length)];
  
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║         ONE AGENT CORP — STAGE 0: NEXT PROJECT           ║');
  console.log('║    Trends → Red Team → Competitive → Offer → Gate 0      ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // Memória de exclusão (lê o que já foi gerado para não repetir)
  let pastIdeas = "Nenhuma (primeira rodada)";
  try {
    const fullReport = await readFile(path.join(ROOT, 'PROCESS_EVOLUTION.md'), 'utf-8');
    pastIdeas = fullReport.slice(-2000); // Pega o histórico recente
  } catch (e) {}

  // CLEANUP opcional...


  // ────────────────────────────────────────────────────────────────────────────
  // STEP 1 — TRENDS & INTELLIGENCE
  // ────────────────────────────────────────────────────────────────────────────
  const trendsOutput = await callPi(`
${FACTORY_CONTEXT}

Você é o departamento Trends & Intelligence da One Agent Corp, operando com o mindset de Alex Hormozi.

MISSÃO: Identificar as 3 melhores oportunidades de micro-SaaS que resolvem um problema massivo e doloroso (Massive Pain).

Frameworks: JTBD (Jobs to be Done) + Hormozi Value Equation + Blue Ocean Strategy.

CRITÉRIOS DE SELEÇÃO (Hormozi Style):
- Problema: Deve ser uma "dor de cabeça" que o usuário quer resolver AGORA (urgência).
- Dream Outcome: O resultado final deve ser óbvio, valioso e fácil de vender.
- Mercado: SAM $5M–$300M, nichos específicos (ex: "SaaS para donos de agências de SEO" vs "SaaS de Marketing").
- Buildable: 8 semanas (Next.js/Prisma/Stripe).
- NÃO competir de frente com gigantes (Notion, Slack, etc).

ENTREGUE:

## OPORTUNIDADE 1: [Nome]
### JTBD & Pain
- Problema doloroso: O que impede o usuário de dormir?
- Obstáculos (Top 5): O que torna o workaround atual um inferno?
- Dor (1-10): X

### Dream Outcome (O Valor do Destino)
- Qual o "Paraíso" que o usuário alcança? (Em termos de $ ganho, tempo salvo ou status).

### Market Value
- Por que esse nicho tem dinheiro e urgência?
- Valor estimado da dor resolvida por ano: $X

### Opportunity Score: X/10
Componentes: tamanho_mercado(X) + intensidade_dor(X) + buildability(X) + facilidade_de_oferta(X)
`, 'STEP 1/5 — TRENDS & INTELLIGENCE (Mindset Hormozi)');

  await save('1-trends.md', trendsOutput);

  // ────────────────────────────────────────────────────────────────────────────
  // STEP 2 — RED TEAM (stress test — filtra antes de ir adiante)
  // ────────────────────────────────────────────────────────────────────────────
  const redTeamOutput = await callPi(`
${FACTORY_CONTEXT}

Você é o Red Team da One Agent Corp. Seu trabalho é matar ideias ruins ANTES de gastar 8 semanas desenvolvendo.

Você é cético profissional. Não tem interesse em agradar. Só aprova o que sobrevive à destruição.

ANÁLISE DE TRENDS RECEBIDA:
${trendsOutput}

---

Para CADA uma das 3 oportunidades, execute os 7 testes abaixo. Seja brutal e específico.

═══════════════════════════════════════════════════════
TESTE 1 — SUBSTITUIÇÃO POR CHATGPT / NOTEBOOKLM / CLAUDE
═══════════════════════════════════════════════════════
Simule o fluxo exato:
"Usuário abre ChatGPT, digita [X], recebe [Y]. Isso resolve [Z]% da dor?"

- O que o ChatGPT faz que cobre 80%+ do valor do produto?
- O que teria que existir para que o ChatGPT NÃO substitua?
  (dados proprietários? automação recorrente? integração workflow? multi-usuário? compliance?)
- Veredicto: SUBSTITUI FACILMENTE (80%+) / PARCIALMENTE (40-79%) / NÃO SUBSTITUI (<40%)

═══════════════════════════════════════════════════════
TESTE 2 — PRÉ-MORTEM (18 meses depois, o produto morreu)
═══════════════════════════════════════════════════════
Liste as 5 causas de morte mais prováveis, em ordem:
1. [causa específica] — probabilidade: X% — sinal de alerta precoce
2. ...
Qual delas é incontornável (estrutural, não operacional)?

═══════════════════════════════════════════════════════
TESTE 3 — AUDITORIA DE SUPOSIÇÕES OCULTAS
═══════════════════════════════════════════════════════
O Trends fez suposições implícitas que podem estar erradas.
Identifique as 5 mais perigosas:

| # | Suposição | O que precisa ser verdade | Se for falsa, impacto | Testável em <7 dias? Como? |
|---|-----------|--------------------------|----------------------|---------------------------|

═══════════════════════════════════════════════════════
TESTE 4 — AUSÊNCIA DE MOAT
═══════════════════════════════════════════════════════
- Em quanto tempo um dev solo replica com cursor.sh + claude? (horas/dias/semanas)
- O que impede a Anthropic/OpenAI de adicionar isso como feature gratuita amanhã?
- Se der certo, em quantos meses um competidor melhor-financiado chega?
- Existe algum dado proprietário acumulado que cria lock-in genuíno?
- Veredicto: SEM MOAT (morto em <12 meses se der certo) / MOAT FRACO / MOAT REAL

═══════════════════════════════════════════════════════
TESTE 5 — UNIT ECONOMICS EM CENÁRIO DE STRESS
═══════════════════════════════════════════════════════
Calcule os cenários ruins:
- Churn mensal = 2x estimado → break-even em qual mês?
- CAC real = 3x estimado → LTV/CAC cai para?
- Preço precisa cair 40% por pressão competitiva → still viable?
- Infra + LLM API costs escalam de forma inesperada → margem real?
Pergunta-chave: tem margem de segurança suficiente para errar e sobreviver?

═══════════════════════════════════════════════════════
TESTE 6 — "POR QUE NÃO EXISTE JÁ?"
═══════════════════════════════════════════════════════
Se a dor é tão grande e óbvia, por que ninguém resolveu bem?
Resposta honesta (uma ou mais):
□ Problema técnico que só ficou viável agora (qual?)
□ Mercado pequeno demais para VC, grande o suficiente para micro-SaaS
□ Tentaram e falharam — por quê? O que faremos diferente?
□ Existe sim e não pesquisamos direito — nesse caso, arquivar
□ Regulação/compliance que desincentivou até agora

═══════════════════════════════════════════════════════
TESTE 7 — DISTRIBUIÇÃO REAL
═══════════════════════════════════════════════════════
"Código é 10% do trabalho. Distribuição é 90%."
- Onde exatamente (URLs, subreddits, grupos, eventos) ficam os 100 primeiros clientes?
- Por que eles viriam até nós em vez de continuar com workaround atual?
- CAC realista para os primeiros 100 clientes (sem ads, sem sales)?
- Existe um canal com CAC < $80 óbvio e testável em <2 semanas? Se não, o produto está morto.

═══════════════════════════════════════════════════════
VEREDICTO POR OPORTUNIDADE
═══════════════════════════════════════════════════════

### [Oportunidade 1]
**Score de Sobrevivência: X/10** (10 = quase impossível matar)

**KILLERS (matam o projeto se não resolvidos):**
- KILLER 1: [descrição] → Solução existe? → Qual?
- KILLER 2: ...

**Riscos gerenciáveis:**
- RISCO 1: ...

**Veredicto:**
- [ ] APROVADO — avançar para análise competitiva e oferta
- [ ] PIVOTAR — manter a dor, mudar o produto: [pivô específico]
- [ ] ARQUIVAR — razão fatal: [qual killer é incontornável]

---
[Repita para Oportunidades 2 e 3]

═══════════════════════════════════════════════════════
RANKING FINAL PÓS STRESS TEST
═══════════════════════════════════════════════════════

| Posição | Oportunidade | Score Sobrevivência | Veredicto | Motivo em 1 linha |
|---------|-------------|:-------------------:|-----------|-------------------|

**Recomendação para o CEO:**
- Avançar: [qual(is) e por quê sobreviveram]
- Arquivar: [qual(is) e killer fatal]
- Pivotar: [qual(is) com qual ajuste]
`, 'STEP 2/5 — RED TEAM (stress test de viabilidade)');

  await save('2-red-team.md', redTeamOutput);

  // Extrai o veredicto para decidir se continua
  console.log('\n⚡ Red Team concluído. Verificando se há oportunidades aprovadas...');

  // ────────────────────────────────────────────────────────────────────────────
  // STEP 3 — COMPETITIVE INTELLIGENCE (só para oportunidades que passaram)
  // ────────────────────────────────────────────────────────────────────────────
  const competitiveOutput = await callPi(`
${FACTORY_CONTEXT}

Você é o departamento de Competitive Intelligence da One Agent Corp.

TRENDS ANALYSIS:
${trendsOutput.slice(0, 2500)}

RED TEAM ANALYSIS (stress test já realizado):
${redTeamOutput.slice(0, 2500)}

MISSÃO: Análise competitiva focada nas oportunidades que SOBREVIVERAM ao Red Team.
Se o Red Team arquivou ou recomendou pivô, foque na versão pivotada ou na que foi aprovada.

## PORTER'S FIVE FORCES (top oportunidade)
1. Ameaça de entrantes: Baixa/Média/Alta — evidência concreta
2. Poder dos fornecedores: ...
3. Poder dos compradores: ...
4. Substitutos (inclua ChatGPT/AI genérico): ...
5. Rivalidade: ...
**Score de atratividade: X/10**

## MAPA DE POSICIONAMENTO
Eixos mais relevantes para este mercado: [eixo X] × [eixo Y]
Posição dos 5 principais competidores + onde ficamos nós

## ANÁLISE DE MOAT ALCANÇÁVEL (foco nos 2 mais realistas)
Para cada um: o que temos que construir nos primeiros 90 dias para que esse moat se desenvolva?

## BATTLE CARDS — Top 3 Competidores
Para cada:
- Força principal deles
- Fraqueza explorável
- Nossa vantagem específica
- Resposta para objeção: "Mas [competidor] já faz isso..."

## JANELA DE OPORTUNIDADE
- Aberta por quanto tempo?
- O que fecha essa janela? (evento, player, mudança de mercado)
- O que precisamos lançar antes que a janela feche?

## VEREDICTO COMPETITIVO
Vale entrar: Sim/Não — justificativa em 3 frases
`, 'STEP 3/5 — COMPETITIVE INTELLIGENCE');

  await save('3-competitive.md', competitiveOutput);

  // ────────────────────────────────────────────────────────────────────────────
  // STEP 4 — OFFER & MONETIZATION
  // ────────────────────────────────────────────────────────────────────────────
  const offerOutput = await callPi(`
${FACTORY_CONTEXT}

Você é o departamento de Offer & Monetization da One Agent Corp. Seu guia é o livro "$100M Offers" de Alex Hormozi.

MISSÃO: Transformar o micro-SaaS em uma "Grand Slam Offer" — uma oferta tão boa que o cliente se sente um idiota ao dizer não.

ANÁLISES PRÉVIAS:
${trendsOutput.slice(0, 1000)}
${redTeamOutput.slice(0, 1000)}

## 1. A EQUAÇÃO DO VALOR (Hormozi)
Defina cada componente para maximizar o valor percebido:
- Dream Outcome (O que eles ganham?):
- Perceived Likelihood of Achievement (Como garantimos que funciona?):
- Time Delay (Quão rápido eles veem o primeiro resultado?):
- Effort & Sacrifice (O que eles NÃO precisam fazer?):

## 2. A OFERTA "GRAND SLAM"
- Nome Magnético: (Curto, focado em resultado)
- O Gancho (Headline): "Como [Resultado] em [Tempo] sem [Dor/Esforço]"
- O Core (O que é entregue):
- Bônus Empilhados (Stacking): (Crie bônus que resolvam os TOP 10 Obstáculos identificados)
- Garantia Insuperável: (Ex: "Se não X em Y dias, você Z")

## 3. PRECIFICAÇÃO E ESCASSEZ
- Preço Anchor (Valor Real): $X
- Preço de Oferta: $X (Deve ser 1/10 do valor percebido)
- Escassez/Urgência Real: (Ex: vagas limitadas, bônus para os primeiros 10)

## 4. RESOLVENDO OBSTÁCULOS
Liste os 5 maiores "Por que não comprariam?" e a solução incluída na oferta para cada um.

## POSICIONAMENTO FINAL
"Para [ICP], [Produto] é o único que [Unique Mechanism] para atingir [Dream Outcome] sem [Effort/Sacrifice]."
`, 'STEP 4/5 — OFFER & MONETIZATION (Grand Slam Offer Architecture)');

  await save('4-offer.md', offerOutput);

  // ────────────────────────────────────────────────────────────────────────────
  // STEP 5 — CEO GATE 0 DECISION DOC
  // ────────────────────────────────────────────────────────────────────────────
  const gateOutput = await callPi(`
${FACTORY_CONTEXT}

Você é o CEO da One Agent Corp. Recebeu as análises dos 4 departamentos do Stage 0.
Tome a decisão de GO/NO-GO com base nas evidências — não em otimismo.

RESUMO TRENDS:
${trendsOutput.slice(0, 1200)}

RESUMO RED TEAM:
${redTeamOutput.slice(0, 1200)}

RESUMO COMPETITIVE:
${competitiveOutput.slice(0, 1000)}

RESUMO OFFER:
${offerOutput.slice(0, 1000)}

---

# GATE 0 — DECISION DOC

## Projeto Recomendado
**Nome:** ...
**Tagline:** ...
**Categoria:** ...

## Resumo Executivo (3 frases máximo)

## Opportunity Score Consolidado

| Dimensão | Score | Fonte |
|----------|:-----:|-------|
| Mercado (TAM/SAM/dor) | X/10 | Trends |
| Resistência ao stress test | X/10 | Red Team |
| Vantagem competitiva | X/10 | Competitive |
| Qualidade da oferta | X/10 | Offer |
| **TOTAL PONDERADO** | **X/10** | |

Fórmula: (Mercado×0.2) + (Red Team×0.35) + (Competitive×0.2) + (Offer×0.25)
*O Red Team tem peso maior porque um produto que não sobrevive ao stress test não é construído.*

## Por Que AGORA (ou por que não)

## Projeção Financeira (cenário conservador)
| Métrica | Valor | Premissa |
|---------|-------|----------|

## Killers Residuais e Plano de Mitigação
Para cada killer que o Red Team identificou, qual é o plano concreto?

## Stack Recomendado e Justificativa

## DECISÃO

**[ ] GO** — Score ≥ 7.0, killers têm mitigação viável
**[ ] PIVOTAR** — Dor real mas produto precisa de ajuste: [especificar]
**[ ] NO-GO** — Killer incontornável: [qual]

## Se GO — Próximos 3 Steps (com critérios de sucesso mensuráveis)
1. **[Ação]** — critério de sucesso: [métrica + número + prazo]
2. **[Ação]** — critério de sucesso: ...
3. **[Ação]** — critério de sucesso: ...

## Pergunta-Chave que o CEO deve responder antes de iniciar Stage 1
(A pergunta mais importante que ainda não temos resposta)

---
*Gate 0 — ${new Date().toLocaleDateString('pt-BR')}*
`, 'STEP 5/5 — CEO GATE 0 DECISION DOC');

  await save('5-gate0-decision.md', gateOutput);

  // Full report
  await save('FULL-REPORT.md', [
    '# Stage 0 — Full Report',
    `**Data:** ${new Date().toLocaleString('pt-BR')}`,
    `**Pipeline:** Trends → Red Team → Competitive → Offer → Gate 0`,
    '',
    '---',
    '## 1. Trends & Intelligence',
    trendsOutput,
    '---',
    '## 2. Red Team — Stress Test',
    redTeamOutput,
    '---',
    '## 3. Competitive Intelligence',
    competitiveOutput,
    '---',
    '## 4. Offer & Monetization',
    offerOutput,
    '---',
    '## 5. Gate 0 — CEO Decision',
    gateOutput,
  ].join('\n\n'));

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║               STAGE 0 CONCLUÍDO ✓                       ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  console.log('📁 Relatório: projects/stage0-research/FULL-REPORT.md');
  console.log('📋 Decision doc: projects/stage0-research/5-gate0-decision.md\n');
  console.log('Próximos passos:');
  console.log('  GO:      npx tsx bin/oac.ts launch --project "<nome>" --description "<desc>"');
  console.log('  PIVOTAR: edite o contexto e rode novamente');
  console.log('  NO-GO:   npx tsx scripts/stage0-next-project.ts\n');
}

main().catch((err: unknown) => {
  console.error('\n✗ Stage 0 failed:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
