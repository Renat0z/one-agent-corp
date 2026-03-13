Olá, aqui é o VP de Produto e Arquiteto de Software da One Agent Corp.

O **ProfitBridge AI** (codinome InventoryBot) é o nosso projeto de maior prioridade. O Red Team confirmou: não é um "wrapper" de GPT. É uma peça de infraestrutura crítica que resolve uma dor de $200k/ano: **o desperdício de ad spend em produtos sem estoque ou sem margem.**

Abaixo, o PRD Técnico focado em execução acelerada por ciclos.

---

# 📄 PRD Técnico: ProfitBridge AI
**Status:** Definição de MVP | **Prioridade:** Crítica (9.5/10) | **Unidade:** 8 Ciclos de Experimento

## 1. Visão Geral & "Mecanismo Único"
O **ProfitBridge AI** não é um dashboard de BI; é um **Middleware de Execução de Lances**. 

*   **O Problema:** O Google Ads não sabe quanto estoque você tem no armário B. O Shopify não sabe quanto você está pagando por clique no anúncio C.
*   **O Mecanismo Único (The Profit-Bridge):** Uma engine que correlaciona o **DOI (Days of Inventory)** e a **Margem Real (Net Margin)** para automatizar o *bidding*. 
    *   *Exemplo:* Se o produto X tem margem de 40%, mas o estoque dura apenas 3 dias, o ProfitBridge reduz o lance em 50% imediatamente para evitar o "clique perdido" (venda que não pode ser entregue ou que acaba o estoque no meio do dia).

## 2. User Stories (Hormozi Style)
*   **O Dono do E-commerce:** "Como dono, eu quero que meus anúncios parem de queimar dinheiro em produtos esgotados para que meu lucro líquido no final do mês seja real, e não uma métrica de vaidade do ROAS."
*   **O Gestor de Tráfego:** "Como gestor, eu quero parar de atualizar planilhas de estoque manualmente toda manhã para ajustar lances, para que eu possa focar em escala e criativos, sabendo que o robô protege a margem."

## 3. Arquitetura Técnica
A stack será **TypeScript/Node.js** (Zero runtime libraries extras) com foco em latência mínima.

### Fluxo de Dados:
1.  **Ingestion Layer:** Webhooks do Shopify (Inventory Level Update) + Google Ads API (Campaign/Ad Group Stats).
2.  **Logic Engine (The Bridge):**
    *   `Stock_Buffer`: Se `current_stock` <= `safe_threshold`, dispara `Kill_Switch`.
    *   `Margin_Check`: `Price` - (`COGS` + `Shipping` + `Gateway_Fees` + `Current_CPA`) = `Net_Profit`.
3.  **Execution Layer:** API de Google Ads `Mutate` para pausar AdGroups ou reduzir `CpcBid`.

### Definição do Buffer de Estoque:
O **Safe Threshold** não é um número estático (ex: 5 unidades). Ele é calculado como:
`Threshold = (Média de Vendas Diárias * 1.5)`. Se o estoque cair abaixo disso, o anúncio entra em "Modo de Preservação".

## 4. Funcionalidades Core (MVP)
*   **Importador de SKUs & Margem:** Upload de CSV ou conexão Shopify para definir o COGS (Custo da Mercadoria) de cada item.
*   **Calculadora POAS (Profit-on-Ad-Spend):** Um monitor que mostra o lucro real por SKU após descontar o gasto de anúncio.
*   **Kill Switch Automatizado:** Pausa imediata de AdGroups no Google Ads quando o SKU associado chega ao Threshold de segurança.

## 5. Roadmap de 8 CICLOS (Unidade de Progresso)

| Ciclo | Foco | Entrega Técnica (Minimum Testable) |
| :--- | :--- | :--- |
| **C1** | **Conectividade** | Auth OAuth2 com Shopify e Google Ads; listagem de SKUs. |
| **C2** | **Data Match** | Algoritmo de cruzamento: SKU (Shopify) == Final URL/Tracking Template (Ads). |
| **C3** | **Margin Engine** | Input de COGS/Frete e cálculo de POAS estático em dashboard. |
| **C4** | **The Kill Switch** | Script que pausa 1 campanha específica se o estoque for < X via API. |
| **C5** | **DOI Logic** | Implementação do cálculo de "Dias de Inventário" baseado em histórico de 7 dias. |
| **C6** | **Bid Adjuster** | Redução automática de lances (-20%, -50%) baseada na escassez de estoque. |
| **C7** | **Error Handling** | Sistema de logs para garantir que anúncios não fiquem pausados por erro de API. |
| **C8** | **Beta Scalability** | Suporte a múltiplas contas e geração de "Relatório de Dinheiro Salvo". |

## 6. Definição de Pronto (DoR/DoD)

### Definition of Ready (Para iniciar o Ciclo 1):
*   Credenciais de Developer da Google Ads API aprovadas.
*   App Shopify (Custom) criado para testes de webhook.
*   Planilha de COGS de um cliente real para teste de margem.

### Definition of Done (Para o MVP ser considerado Validado):
*   **Latência:** O tempo entre o estoque zerar no Shopify e o anúncio pausar deve ser < 10 minutos.
*   **Acurácia:** O cálculo de POAS deve bater com a realidade contábil do cliente (margem de erro < 2%).
*   **ROI:** O sistema deve provar que economizou pelo menos o valor da sua própria mensalidade no primeiro ciclo de escala.

---

**Próximo Passo para o CEO:**
Aprovar o início do **Ciclo 1**.
Comando sugerido: `npx tsx scripts/create-cycle.ts --project="ProfitBridge AI" --focus="Connectivity"`