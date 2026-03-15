# PRD Técnico: ProfitBridge AI — "The Margin Guardian"
**ID do Projeto:** PROFITBRIDGE-01
**Status:** Draft (High-Density Routing)
**Versão:** 1.0 (O-1 Emulated)

---

## 1. Visão Geral & "Mecanismo Único"
O **ProfitBridge AI** resolve a "Cegueira de Inventário" no e-commerce. O mecanismo único é a **Sincronização Ativa de Bid-to-Inventory (SABI)**. 

Diferente de ferramentas de ROAS tradicionais que olham apenas para o pixel, o ProfitBridge cruza o **Custo de Mercadoria Vendida (COV)** e o **Nível de Estoque em Tempo Real** da Shopify com o **Leilão do Google Ads**.

**O Mecanismo:**
1. **Ingestão:** Lê SKU, Estoque e Margem via Webhook/API Shopify.
2. **Cálculo de Risco:** Se (Estoque < Safe Threshold) OU (Margem Líquida < Min ROAS), gera alerta.
3. **Execução:** Dispara comando via Google Ads API para pausar o grupo de anúncios ou reduzir o lance (Bid) em 70% instantaneamente, evitando queimar caixa em produtos que vão esgotar ou que estão dando prejuízo após impostos/frete.

---

## 2. User Stories (Hormozi Style)
- **Como um Dono de E-commerce (The Scale Hunter):** "Eu quero que meus anúncios parem automaticamente assim que um produto atingir 5 unidades no estoque, para que eu não gaste meu lucro vendendo o que não posso entregar e evite o estresse de reembolsos."
- **Como um Gestor de Tráfego (The Efficiency Architect):** "Eu quero importar minha planilha de custos de frete e impostos uma única vez para que a IA pause as campanhas onde o ROAS real (lucro no bolso) está negativo, mesmo que o Google diga que está 'bom'."

---

## 3. Arquitetura Técnica
### Fluxo de Dados
1. **Shopify Integration:** Node.js App ouvindo `orders/create` e `inventory_levels/update`.
2. **Decision Engine (The Brain):**
   - **Buffer de Estoque:** `current_stock - velocity_7d > safety_threshold`.
   - **Margem Dinâmica:** `(Price - COGS - Shipping - Taxes) / Price`.
3. **Ads Connector:** Python/Node worker utilizando a Google Ads API (GoogleAdsService) para gerenciar o status de `AdGroup` ou `Campaign`.

### Definição do Buffer (Safe Threshold)
O sistema calcula o "Lead Time" do fornecedor vs. "Sales Velocity". 
`Safe Threshold = (Média de vendas diárias * 3 dias) + Margem de Erro (15%)`.

---

## 4. Funcionalidades Core (MVP)
- **Importador de SKUs:** Sync automático via API Shopify.
- **Calculadora de Margem Líquida:** Campo para input de Impostos (%), Frete Fixo ($) e COGS ($).
- **The Kill Switch:** Dashboard com toggle "Auto-Pause" que monitora o estoque 24/7.
- **Relatório de "Lucro Salvo":** Estimativa de quanto CAC foi economizado ao pausar anúncios de produtos sem estoque.

---

## 5. Roadmap de 8 CICLOS (Execução HARD)

### CICLO 1: Fundação & Sync (The Skeleton)
- Setup da infra VPS + Docker.
- Conexão OAuth com Shopify.
- Importação de lista de produtos e níveis de estoque.

### CICLO 2: O Motor de Cálculo (The Calculator)
- Interface para input de custos fixos/variáveis por SKU.
- Algoritmo de cálculo de Margem de Contribuição.

### CICLO 3: Integração Google Ads (The Handshake)
- Conexão via Google Ads API (Developer Token).
- Mapeamento de SKU Shopify <-> ID de Produto no Google Merchant Center/Ads.

### CICLO 4: Automação Alpha (The Kill Switch)
- Implementação da lógica de pausa automática baseada em estoque zero.
- Logs de execução (Audit Trail).

### CICLO 5: Safe Threshold & Inteligência (The Buffer)
- Implementação do cálculo de velocidade de vendas.
- Pausa preditiva (antes do estoque zerar).

### CICLO 6: Bid Management (The Optimizer)
- Em vez de apenas pausar, o sistema reduz o lance (bid) para "Low Priority" quando o estoque está baixando.

### CICLO 7: Dashboard de Profit (The Proof)
- Interface visual mostrando ROAS Real (Lucro) vs ROAS do Pixel (Bruto).
- Ativação do "Profit Guardian" (Pausar se Margem < X).

### CICLO 8: Escala & Multi-Account (The Fleet)
- Suporte a múltiplas lojas Shopify e contas de Ads no mesmo dashboard.
- Beta fechado para 10 usuários pagantes.

---

## 6. Definição de Pronto (DoR/DoD)
- **DoR (Ready to Start):** API Tokens de teste (Shopify/Google) disponíveis.
- **DoD (Done):** Script roda em menos de 30s, identifica produto sem estoque e altera status no Google Ads com 100% de sucesso nos testes de sandbox.

---
# One Agent Corp | ProfitBridge AI | v1.0
