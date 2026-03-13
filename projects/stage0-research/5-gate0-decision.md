# GATE 0 — DECISION DOC

## Projeto Recomendado
**Nome:** **ProfitLock™**
**Tagline:** O Cadeado do Lucro para High-Ticket Infoproducts.
**Categoria:** Revenue Recovery & Fraud Prevention (FinTech/EdTech).

## Resumo Executivo
O ProfitLock™ ataca a perda de lucro líquido de infoprodutores causada por chargebacks e "reembolsos amigáveis" de má fé. Ele utiliza um pixel de rastreamento forense para provar consumo de conteúdo e uma Blacklist Global compartilhada para criar um efeito de rede defensivo. É uma oferta de ROI imediato (dinheiro de volta no bolso do cliente) com um mecanismo único de defesa técnica.

## Opportunity Score Consolidado

| Dimensão | Score | Fonte |
|----------|:-----:|-------|
| Mercado (TAM/SAM/dor) | 9.0/10 | Trends |
| Resistência ao stress test | 8.5/10 | Red Team |
| Vantagem competitiva | 7.5/10 | Competitive |
| Qualidade da oferta | 9.5/10 | Offer |
| **TOTAL PONDERADO** | **8.6/10** | |

*Fórmula: (9.0×0.2) + (8.5×0.35) + (7.5×0.2) + (9.5×0.25) = 1.8 + 2.975 + 1.5 + 2.375 = 8.65*

## Por Que AGORA
O mercado de infoprodutos amadureceu e as margens de lucro estão sendo esmagadas pelo aumento do CAC em anúncios. Nesse cenário, recuperar um reembolso de $1.000 é muito mais barato do que vender $1.000 para um novo lead. A tecnologia de LLM permite hoje automatizar as disputas com um nível de personalização "forense" que antes exigia um analista humano.

## Projeção Financeira (cenário conservador)
| Métrica | Valor | Premissa |
|---------|-------|----------|
| **LTV (6 meses)** | $582 | Mensalidade de $97 com churn de 15%. |
| **CAC Alvo** | < $150 | Outreach frio e parcerias com plataformas de checkout. |
| **Ponto de Equilíbrio** | 30 Clientes | Cobre infra de API, LLM e custos iniciais de dev. |

## Killers Residuais e Plano de Mitigação
1. **Risco de Plataforma (Stripe/Hotmart):** Eles podem limitar o acesso a mensagens de disputa.
   - *Mitigação:* Focar na prova técnica (logs do pixel) enviada via PDF, que é aceita em qualquer disputa manual, independente da automação da API.
2. **Privacidade (LGPD):** Rastreamento granular de usuários.
   - *Mitigação:* Termos de Uso "blindados" incluídos na oferta para o cliente, garantindo consentimento para fins de segurança antifraude.

## Stack Recomendado e Justificativa
- **Next.js + Prisma:** Velocidade de ciclo.
- **Stripe API:** Integração profunda para gestão de disputas.
- **Vercel AI SDK (Claude 3.5 Sonnet):** Melhor redação de argumentos técnicos para as disputas.
- **Cloudflare Workers:** Para o pixel de rastreamento (baixa latência e escala global).

## DECISÃO

**[X] GO** — Score 8.6. O produto resolve uma dor financeira direta (Fear of Loss) e possui um Moat de rede claro.

## Se GO — Próximos 3 Steps (Ciclo 1)
1. **Validação de Demanda (LOI):** Conseguir 5 Cartas de Intenção (LOI) ou pré-vendas de $97 de infoprodutores que faturam >$50k/mês. 
   - *Sucesso:* 5 assinaturas em 10 dias.
2. **MVP do "Dossiê Forense":** Gerar manualmente 3 dossiês de defesa para clientes reais usando logs de vídeo e ver se o Stripe aceita.
   - *Sucesso:* Ganhar pelo menos 1 disputa que seria perdida.
3. **Draft da Blacklist:** Cruzar dados de 3 produtores amigos para identificar os primeiros 50 "reembolsadores seriais".
   - *Sucesso:* Identificar pelo menos 3 usuários em comum.

## Pergunta-Chave que o CEO deve responder antes de iniciar Stage 1
**"Qual é o menor número de logs técnicos (ex: tempo de vídeo, IP, cliques) que o Stripe considera como 'prova irrefutável' para encerrar uma disputa a favor do vendedor?"**
*(Se descobrirmos o 'padrão ouro' da prova, o produto torna-se imbatível).*