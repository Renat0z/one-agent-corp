# PRD Técnico: ProfitBridge AI (v1.0)
## Identity: CLAUDIO-HARD (High-Density Architecture)

### 1. Visão Geral & "Mecanismo Único"
O **ProfitBridge AI** é um middleware de inteligência financeira para e-commerce que resolve a desconexão entre o **Estoque/Margem Lógica** (Shopify) e a **Intencionalidade de Compra** (Google Ads).

**O Mecanismo Único (The Profit-Lock):** 
Diferente de gerenciadores de anúncios comuns que focam em ROAS, o ProfitBridge opera no **POI (Profit on Inventory)**. Ele intercepta webhooks de alteração de estoque e recalcula a viabilidade de anúncio em tempo real. Se a margem de contribuição de um SKU cai abaixo do threshold (devido a frete, impostos ou baixo estoque), o motor dispara uma mutação na API do Google Ads para pausar o grupo de anúncios em < 120 segundos.

---

### 2. User Stories (Hormozi Style)
*   **O Dono de E-commerce (The Victim of Invisible Bleeding):** "Eu quero que meus anúncios parem automaticamente quando eu tiver menos de 5 unidades de um SKU de alta rotatividade, para que eu não pague por cliques que resultam em 'Produto Indisponível' e não queime meu CAC em itens de baixa margem."
*   **O Gestor de Tráfego (The Data Slave):** "Eu quero importar todos os SKUs e seus custos (COGS) em massa, para que a IA pause as campanhas sem que eu precise checar planilhas de estoque manualmente todo domingo."

---

### 3. Arquitetura Técnica & Performance
#### Fluxo de Dados (Low-Latency Pipeline)
1.  **Ingestão:** Webhook Shopify (`orders/create`, `products/update`).
2.  **Transformação:** Normalização JSON para Schema Interno (Protobuf para processamento em memória).
3.  **Engine de Decisão:** Validação contra a `Margin-Matrix` (Redis Cache).
4.  **Ação:** Google Ads API `MutateJob`.

#### Parâmetros de Performance (SLAs)
| Métrica | Target | Threshold de Alerta |
| :--- | :--- | :--- |
| Latência de Webhook (Ingest -> Process) | < 450ms | > 2000ms |
| Sync de Estoque (Shopify -> DB) | Real-time | > 5 min delay |
| Propagação de Pausa (API Google Ads) | < 120s | > 300s |
| Uptime do Kill Switch | 99.99% | < 99.9% |
| Throughput de SKUs | 10k/min | < 1k/min |

---

### 4. Funcionalidades Core (MVP)
#### A. Importador de SKUs & COGS
*   Integração via API Shopify Admin (REST/GraphQL).
*   Mapeamento de campos: `variant_id`, `sku`, `price`, `inventory_quantity`.
*   Input manual de `COGS` (Cost of Goods Sold) e `Estimated_Shipping`.

#### B. Calculadora de Margem Dinâmica (DMC)
*   **Fórmula:** `Net_Profit = Price - (COGS + Shipping + Platform_Fee + (Current_CAC * 1.1))`
*   Interface para definição de **Safe Threshold** (ex: Pausar se Margem < 15.5%).

#### C. O "Kill Switch"
*   Monitoramento de `inventory_level`.
*   **Buffer de Segurança:** Trigger de pausa quando `inventory <= N` (onde N é configurável por SKU).
*   Logs de Auditoria: Registro exato de por que e quando um anúncio foi pausado.

---

### 5. Roadmap de 8 CICLOS (The Execution Path)
| Ciclo | Nome | Entregável Técnico |
| :--- | :--- | :--- |
| **C1** | Connectivity | Auth OAuth2 (Shopify & Google) + Sync de Inventário Base. |
| **C2** | Margin Engine | CRUD de Custos e Lógica de Cálculo de Lucro Líquido. |
| **C3** | The Kill Switch | Automação de Pausa via Google Ads API (AdGroup Level). |
| **C4** | Threshold UI | Dashboard de alertas e definição de regras por categoria. |
| **C5** | Analytics Bridge | Relatório de "Dinheiro Salvo" (Cliques evitados em itens sem lucro). |
| **C6** | Performance Optimization | Migração do processamento de regras para Redis/Go worker. |
| **C7** | Multi-Channel Expansion | Adição de Meta Ads (Facebook/Instagram) ao Kill Switch. |
| **C8** | Auto-Scaling Bidding | Ajuste de lances (Bids) baseado na saúde do estoque (Beta). |

---

### 6. Definição de Pronto (DoR/DoD)
*   **DoR (Ready to Build):** Diagrama de sequência finalizado; Credenciais de Sandbox (Shopify/Google) ativas; Schema de banco definido.
*   **DoD (Done):** Cobertura de testes unitários > 85%; Pausa de anúncio validada em < 3 minutos após zerar estoque no Shopify; Documentação de API concluída.

---
**Assinado:** CLAUDIO-HARD | Arquiteto de Software | One Agent Corp
