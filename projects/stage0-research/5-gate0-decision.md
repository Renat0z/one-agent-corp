# GATE 0 — DECISION DOC

## Projeto Recomendado
**Nome:** **ProfitBridge AI** (Anteriormente InventoryBot)
**Tagline:** O "Piloto Automático" que pausa anúncios inúteis e protege seu lucro líquido.
**Categoria:** E-commerce / AdTech (Profit Optimization)

## Resumo Executivo
ProfitBridge AI resolve o "vazamento de caixa" silencioso em e-commerces de médio porte: o gasto com anúncios para produtos sem estoque ou com margem negativa. Ao conectar diretamente o inventário do Shopify à API de lances do Google/Meta, garantimos ROI imediato ao interromper o desperdício em tempo real, algo que as próprias redes de anúncios têm um desincentivo financeiro para fazer.

## Opportunity Score Consolidado

| Dimensão | Score | Fonte |
|----------|:-----:|-------|
| Mercado (TAM/SAM/dor) | 9.5/10 | Trends |
| Resistência ao stress test | 9.4/10 | Red Team |
| Vantagem competitiva | 9.0/10 | Competitive |
| Qualidade da oferta | 9.8/10 | Offer |
| **TOTAL PONDERADO** | **9.44/10** | |

*Fórmula: (9.5×0.2) + (9.4×0.35) + (9.0×0.2) + (9.8×0.25) = 9.44*

## Por Que AGORA
A eficiência operacional tornou-se o novo "Growth" em 2026. Com o aumento do CAC e a compressão das margens de e-commerce, ferramentas passivas (dashboards) não são mais suficientes. O mercado exige ferramentas de **execução ativa** que recuperem capital imediatamente sem adicionar horas de trabalho humano.

## Projeção Financeira (Cenário Conservador)
| Métrica | Valor | Premissa |
|---------|-------|----------|
| **Pricing** | $297/mês | Flat fee inicial para validação rápida. |
| **LTV** | $3,564 | Retenção estimada de 12 meses (software "set & forget"). |
| **CAC** | $150 | Via parcerias com agências e ferramentas gratuitas de auditoria. |
| **LTV/CAC** | 23.7x | Extremamente saudável para escala. |

## Killers Residuais e Plano de Mitigação
1. **Delay das APIs (Killer 1):** O Google pode demorar a processar o comando de pausa. 
   - *Mitigação:* Implementar "Safe Thresholds". Pausar o anúncio quando o estoque chegar a 3 unidades (Buffer), não zero.
2. **Dependência de Plataforma (Killer 2):** Mudanças na API da Shopify/Google.
   - *Mitigação:* Diversificação. Iniciar com Shopify+Google, expandir para WooCommerce+Meta em 30 dias.
3. **Responsabilidade Jurídica (Killer 3):** Pausar o anúncio errado e causar perda de vendas.
   - *Mitigação:* Modo "Shadow" (Somente Sugestão) nos primeiros 3 dias de cada usuário para ganhar confiança.

## Stack Recomendado e Justificativa
**Next.js + Prisma + PostgreSQL + Redis (para filas de sincronização de estoque) + Docker.**
*Justificativa:* Nossa stack padrão é ideal. Redis é essencial aqui para lidar com webhooks de estoque em alta frequência sem gargalos de banco de dados.

## DECISÃO

**[X] GO** — Score excepcional. O ROI é matemático, o Moat é baseado no conflito de interesses das redes de anúncios e a dor é "hemorrágica".

## Próximos 3 Steps (Critérios de sucesso mensuráveis)
1. **Fechamento Técnico (APIs):** Validar latência de sincronização Shopify -> Google Ads.
   - *Sucesso:* Sincronização completa em < 5 minutos em ambiente de staging até 15/03.
2. **Lead Magnet (Wasted Spend Calculator):** Lançar ferramenta gratuita de auditoria para capturar leads.
   - *Sucesso:* 100 leads qualificados (e-commerces > $20k/mês) em 7 dias.
3. **MVP Core:** Construir o motor de "Auto-Pause" para o SKU principal.
   - *Sucesso:* Primeiro anúncio pausado automaticamente em conta teste até 25/03.

## Pergunta-Chave para o CEO
**As agências de tráfego (nossos canais de distribuição) nos verão como uma ameaça à sua gestão ou como uma ferramenta que as torna "heróis" perante o cliente ao economizar orçamento?**
*(Minha hipótese: Se posicionarmos como "Co-piloto do Gestor", teremos um exército de vendedores gratuitos).*

---
*Gate 0 — 12/03/2026*
**Assinado: CEO, One Agent Corp.**