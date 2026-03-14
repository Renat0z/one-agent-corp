Olá, aqui é o **CLAUDIO-HARD**, seu VP de Produto e Arquiteto de Software. 

Processando **THREAD ALPHA (Orchestrator)** para o projeto **ProfitBridge AI**. 
Identifiquei que, embora a análise de Stage 0 enviada mencione outras oportunidades (ClaimGuard, LeadSieve), o foco imediato é a materialização do **ProfitBridge AI** — o "Mecanismo Único" de proteção de margem para e-commerce.

Abaixo, o **PRD Técnico de Alta Densidade**, estruturado para execução em **8 Ciclos de Evolução**.

---

# 📑 PRD TÉCNICO: ProfitBridge AI (v1.0)
**ID do Projeto:** `PROFIT-BRIDGE-01`  
**Status:** Planejamento de Arquitetura  
**Prioridade:** Crítica (Foco em ROAS Real vs. Lucro Líquido)

## 1. Visão Geral & "Mecanismo Único"
O **ProfitBridge AI** resolve o "Abismo do Estoque Fantasma". 
*   **O Problema:** Gestores de tráfego escalam anúncios de produtos que acabaram de esgotar ou que tiveram a margem corroída por aumento de frete/custo de produto, gerando prejuízo em tempo real.
*   **O Mecanismo Único:** Uma **Engine de Sincronização Bidirecional** que correlaciona o *LTV/CAC* do Google Ads com o *Inventory Health* da Shopify. O sistema atua como um **Kill Switch Inteligente** e um **Re-Bidder**, pausando campanhas ou reduzindo lances automaticamente quando o lucro unitário (considerando COGS e impostos) cai abaixo do "Safe Threshold".

## 2. User Stories (Hormozi Style)
*   **Como dono de e-commerce**, eu quero que meus anúncios parem de rodar no segundo que meu lucro líquido por venda for menor que R$ 10,00, para que eu nunca mais "pague para trabalhar" no final do mês.
*   **Como gestor de tráfego**, eu quero receber um alerta no Slack/WhatsApp quando um produto campeão estiver com estoque baixo (ex: < 5 unidades), para que eu possa reduzir o orçamento antes do Google gastar meu Pixel em cliques que não converterão por falta de numeração/cor.

## 3. Arquitetura Técnica
### A. Fluxo de Dados
1.  **Ingestão:** Webhooks da Shopify (Order Created, Product Updated).
2.  **Processamento:** Engine Node.ts calcula: `Margem = (Preço - Impostos - Gateway - COGS - Frete Médio)`.
3.  **Decisão:** Comparação da `Margem` com o `CPA Atual` extraído via Google Ads API (Reports).
4.  **Ação:** Se `CPA > (Margem * 0.7)`, o sistema dispara um `mutate` na Google Ads API para pausar o AdGroup ou reduzir o lance em 50%.

### B. Definição do Buffer de Estoque (Safe Threshold)
*   O sistema não espera o estoque chegar a 0.
*   **Cálculo:** `Velocity_Rate (vendas/dia) * Lead_Time_For_Action`. 
*   Se o produto vende 20/dia e a API do Google demora 4h para propagar a pausa, o Kill Switch deve atuar quando o estoque chegar em 5 unidades.

## 4. Funcionalidades Core (MVP)
1.  **Smart SKU Importer:** Conexão direta com Shopify para puxar preços e níveis de estoque.
2.  **Dynamic Margin Calculator:** Dashboard onde o usuário insere os custos fixos/variáveis por SKU.
3.  **The Kill Switch:** Automação que pausa campanhas no Google Ads baseada em regras de "Lucro Mínimo".
4.  **Health Check Dashboard:** Visão clara de quanto lucro foi "salvo" por anúncios pausados preventivamente.

## 5. Roadmap de 8 CICLOS (Foco em Execução)

| Ciclo | Nome | Entrega Principal (Milestone) |
| :--- | :--- | :--- |
| **C1** | **Foundation** | Auth + Conectores API (Shopify Read-Only + Google Ads Read). |
| **C2** | **The Brain** | Engine de cálculo de margem e importação manual de COGS (Custo de Mercadoria). |
| **C3** | **Monitoring** | Dashboard de "Prejuízo em Potencial" (Mostra onde o usuário está perdendo dinheiro hoje). |
| **C4** | **The Kill Switch** | Implementação da escrita na API do Google Ads (Pausar campanhas/AdGroups). |
| **C5** | **Safe Threshold** | Algoritmo de previsão de quebra de estoque baseado em velocidade de vendas. |
| **C6** | **Optimization** | Re-bid automático: Reduzir lance em vez de pausar (estratégia de "manutenção"). |
| **C7** | **Multi-Channel** | Expansão para Meta Ads (Facebook/Instagram) com a mesma lógica de margem. |
| **C8** | **Scale & AI** | IA que sugere aumento de orçamento para SKUs com maior margem e estoque saudável. |

## 6. Definição de Pronto (DoR/DoD)
*   **Definition of Ready (DoR):** API da Shopify e Google Ads validadas com tokens de produção.
*   **Definition of Done (DoD):** Um script de teste deve simular uma venda que zera a margem e confirmar que a campanha no Google Ads foi pausada em menos de 15 minutos.

---

**PRÓXIMOS PASSOS (MANDATO DO ROUTER):**
Para iniciar a execução, devo rodar a chain de infraestrutura:
`npx tsx scripts/orchestrator.ts --chain=cycle --project=profitbridge --cycle=1`

**Aguardando confirmação para disparar o Ciclo 1.**