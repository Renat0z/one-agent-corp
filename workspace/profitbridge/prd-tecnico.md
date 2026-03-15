# PRD Técnico: ProfitBridge AI
## Identidade do Projeto: PB-AI-V10
**Status:** Draft (Stage 0 Approved)
**Arquitetos:** CLAUDIO-HARD (VP de Produto / Software Architect)

---

## 1. Visão Geral & "Mecanismo Único"
O **ProfitBridge AI** é um middleware de inteligência logística-financeira que conecta em tempo real o inventário da Shopify ao motor de lances do Google Ads (e Meta Ads).

**O Mecanismo Único:** Diferente de gestores de tráfego que olham apenas o ROAS (Retorno sobre Gasto em Anúncios), o ProfitBridge olha para a **Margem de Contribuição Líquida em Tempo Real**. 
- Se o estoque de um produto com alta margem cai abaixo do "Buffer de Segurança", o script reduz o lance preventivamente para evitar ruptura e desperdício de CAC em itens que ficarão indisponíveis.
- Se a margem de um produto oscila (ex: aumento de custo de frete ou fornecedor), o sistema recalcula o ROAS Alvo (tROAS) necessário para manter o lucro, ajustando a campanha automaticamente.

---

## 2. User Stories (Hormozi Style)
*   **Como um Dono de E-commerce faturando +100k/mês**, eu quero que meus anúncios parem de queimar dinheiro em produtos que estão acabando no estoque, para que meu lucro líquido não seja corroído por vendas que não consigo entregar ou por CAC desperdiçado em itens "Out of Stock" iminente.
*   **Como um Gestor de Tráfego**, eu quero que o sistema ajuste o ROAS alvo baseado no lucro real (e não apenas no faturamento), para que eu possa provar meu valor através do lucro no bolso do cliente e não apenas em métricas de vaidade do Dashboard do Google.

---

## 3. Arquitetura Técnica

### Fluxo de Dados (Topological Sort)
1.  **Ingestão (Webhooks Shopify):** Monitoramento de `orders/create` e `products/update`.
2.  **Engine de Decisão (The Brain):**
    *   `Current_Stock` vs `Velocity_Sales_7d`.
    *   `Safe_Threshold` = (Lead_Time_Fornecedor * Vendas_Diarias) + 20%.
3.  **Cálculo de Margem Dinâmica:** 
    *   `Price` - (`COGS` + `Shipping` + `Tax` + `Gateway_Fees`) = `Net_Margin`.
4.  **Execução (Google Ads API):**
    *   Se `Stock < Safe_Threshold` -> `Action: Lower_Bid` ou `Pause_AdGroup`.
    *   Se `Net_Margin` altera -> `Action: Update_tROAS`.

### Definição do Buffer de Estoque
O sistema não usa um número fixo (ex: "pausar com 5 unidades"). Ele usa **Dias de Estoque (DoI - Days of Inventory)**. Se o produto tem 10 unidades mas vende 5 por dia, ele pausa em 2 dias. Se vende 1 por semana, ele mantém o anúncio ativo.

---

## 4. Funcionalidades Core (MVP)
*   **Dashboard de Sincronização:** Interface para mapear SKUs da Shopify com IDs de Campanhas/AdGroups do Google.
*   **Calculadora de Margem de Contribuição:** Input de COGS (Custo de Mercadoria) por SKU.
*   **Kill Switch Automatizado:** Script que roda a cada 1 hora verificando estoque e pausando anúncios via API.
*   **Relatório de "Lucro Salvo":** Estimativa de quanto dinheiro deixou de ser jogado fora em cliques para produtos sem estoque.

---

## 5. Roadmap de 8 CICLOS (Foco em Execução)

| Ciclo | Nome | Objetivo Técnico | Gate de Saída (DoD) |
| :--- | :--- | :--- | :--- |
| **C1** | **Data Foundation** | Conectar APIs Shopify e Google Ads (Read-only). | Dados de estoque e gastos batendo no DB. |
| **C2** | **Margin Engine** | CRUD de COGS e cálculo de margem por SKU. | Dashboard exibindo Lucro Real vs ROAS. |
| **C3** | **The Kill Switch** | Implementar a lógica de pausa automática por estoque. | Script pausa 1 campanha de teste com sucesso. |
| **C4** | **Safety Buffer v1** | Implementar lógica de velocidade de vendas (Sales Velocity). | Ajuste dinâmico baseado em tendência de 7 dias. |
| **C5** | **tROAS Optimizer** | Ajuste de lances baseado na variação da margem. | Google Ads recebe novo tROAS via API. |
| **C6** | **Multi-Channel** | Expansão para Meta Ads (Facebook/Instagram). | Mesma lógica aplicada ao Pixel/CAPI do Meta. |
| **C7** | **Edge Cases & UI** | Tratamento de kits/combos e interface de usuário final. | Usuário consegue configurar regras sem código. |
| **C8** | **Scale & Audit** | Otimização de queries e automação de relatórios semanais. | Sistema estável operando em 10 contas reais. |

---

## 6. Definição de Pronto (DoR/DoD)

### Definition of Ready (DoR)
- [ ] API Keys (Shopify Partner & Google Ads Developer Token) ativas.
- [ ] Mapeamento de 50 SKUs iniciais para teste.
- [ ] Definição da stack (Node.js/TypeScript + Supabase).

### Definition of Done (DoD - MVP)
- [ ] O sistema identifica um produto abaixo do buffer e pausa o anúncio em < 60 min.
- [ ] O cálculo de margem líquida bate com a planilha financeira do cliente (erro < 1%).
- [ ] Log de auditoria registrando cada alteração de lance com o motivo ("Baixo estoque", "Margem reduzida").

---
**Próximo Passo:** Executar `npx tsx scripts/orchestrator.ts --chain=cycle --project=profitbridge` para iniciar o Ciclo 1.