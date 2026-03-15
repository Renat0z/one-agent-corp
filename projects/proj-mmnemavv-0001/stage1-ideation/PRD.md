Entendido. Assumindo a identidade de **VP de Produto & Arquiteto de Software**, processei a análise de Stage 0. Embora a análise de Stage 0 tenha focado em *ClaimGuard* e *LocalLink*, o comando operacional agora é consolidar o **ProfitBridge AI**.

Este projeto resolve a "Hemorragia de Lucro" no e-commerce: vender produtos sem estoque ou com margem negativa devido à latência entre o Shopify e o Google Ads.

---

# 📝 PRD TÉCNICO: ProfitBridge AI (v1.0)
**Status:** Planejamento de Execução | **ID:** `profit-bridge-ai` | **Prioridade:** P0 (Revenue Protection)

## 1. Visão Geral & "Mecanismo Único"
O **ProfitBridge AI** é um middleware de sincronização inteligente.
*   **O Problema:** O Google Ads continua gastando orçamento em produtos que acabaram de esgotar no Shopify ou cujos custos de frete/fornecedor subiram, tornando o ROAS (Retorno sobre Gasto em Anúncios) nominalmente positivo, mas o lucro real negativo.
*   **O Mecanismo Único:** **"Profit-First Bid Management"**. O sistema não olha apenas para o status "In Stock", mas para o **Buffer de Segurança** e a **Margem Dinâmica**. Ele utiliza webhooks de tempo real para pausar campanhas ou ajustar lances (bids) no Google Ads no momento em que a regra de lucro é violada.

---

## 2. User Stories (Hormozi Style)
*   **Como um Dono de E-commerce,** eu quero que meus anúncios parem automaticamente quando eu tiver menos de 5 unidades de um item, para que eu não pague por cliques que resultam em "Produto Indisponível" e frustração do cliente.
*   **Como um Gestor de Tráfego,** eu quero importar meus custos de mercadoria (COGS) e ver meu "Lucro Real por SKU" em um dashboard, para que eu possa escalar apenas o que realmente coloca dinheiro no banco, não apenas o que gera faturamento bruto.

---

## 3. Arquitetura Técnica

### Fluxo de Dados:
1.  **Ingestão:** Webhooks do Shopify (`orders/create`, `products/update`, `inventory_levels/connect`).
2.  **Processamento:** Engine de Decisão em Node.js (TypeScript).
    *   Cálculo: `Preço de Venda - (COGS + Impostos + Frete Estimado + CAC Atual) = Margem Real`.
3.  **Ação:** Google Ads API (Scripts ou REST API).
    *   Ação A: Pausar Grupo de Anúncios/Produto (Kill Switch).
    *   Ação B: Ajustar lance para baixo se a margem estiver "em perigo".

### Definição do Buffer de Estoque:
*   **Safe Threshold (ST):** Calculado com base na velocidade de vendas (`V`). Se `V > 10 unidades/dia`, o ST é de 15 unidades. Se o estoque cair abaixo de ST, o Kill Switch é acionado preventivamente.

---

## 4. Funcionalidades Core (MVP)
*   **SKU Intelligence:** Importação automática de SKUs do Shopify com campos customizados para COGS (Cost of Goods Sold).
*   **Dynamic Margin Calculator:** Dashboard que subtrai custos operacionais do faturamento reportado.
*   **The Kill Switch:** Integração com Google Ads para pausar IDs de produtos específicos baseados em regras de inventário (< X unidades) ou margem (< Y %).
*   **Health Logs:** Relatório diário: "Hoje economizamos $Z em cliques desperdiçados em produtos sem lucro".

---

## 5. Roadmap de 8 CICLOS (Foco em Milestones)

| Ciclo | Nome do Ciclo | Entrega Técnica | Validação de Mercado |
| :--- | :--- | :--- | :--- |
| **C1** | **The Connector** | Auth Shopify + Sync de Inventário básico. | Conectar 3 lojas alpha e validar latência de dados. |
| **C2** | **Profit Engine** | Implementação do cálculo de Margem (COGS + Tax). | Dono da loja valida se os números batem com o Excel. |
| **C3** | **Google Link** | Integração Read-only com Google Ads API. | Mapear SKUs do Shopify com IDs de Anúncios. |
| **C4** | **The Kill Switch** | Automação de Pausa de anúncios por estoque baixo. | **Primeira economia real gerada** (métrica de sucesso). |
| **C5** | **Margin Guard** | Automação de Pausa por margem negativa (Ads Spend > Lucro). | Validar redução de "vendas no prejuízo". |
| **C6** | **Bid Optimizer** | Ajuste de lances baseado em níveis de estoque (Escala vs. Segurança). | Testar aumento de ROAS real em 1 conta. |
| **C7** | **Multi-Channel** | Início da integração com Meta Ads (Facebook/Instagram). | Expansão do LTV do usuário atual. |
| **C8** | **Scale & Dashboard** | Relatórios de "Lucro Recuperado" e UI de escala. | Lançamento oficial (Beta Público). |

---

## 6. Definição de Pronto (DoR/DoD)

### Definition of Ready (Para iniciar o Ciclo 1):
*   API Keys do Shopify Partner e Google Ads Developer Token aprovadas.
*   Esquema de banco de dados (PostgreSQL) desenhado para suportar multi-tenancy.

### Definition of Done (Sucesso do MVP - Ciclo 4):
*   Sistema identifica queda de estoque abaixo do Safe Threshold em < 60 segundos.
*   Script pausa o anúncio correspondente no Google Ads sem intervenção humana.
*   Usuário recebe notificação no Slack/E-mail informando a ação tomada.

---

**PRÓXIMO PASSO (THREAD ALPHA):**
Vou criar a estrutura de diretórios para o projeto e inicializar o `context.json`.

`npx tsx scripts/orchestrator.ts --chain=project --project=profitbridge --concept="Shopify-Google Ads profit protection middleware"`