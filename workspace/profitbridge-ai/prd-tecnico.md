# PRD Técnico: ProfitBridge AI
## Identidade do Projeto: `profitbridge-ai`
**Status:** Draft v1.0 (Ciclo 1)
**Responsável:** VP de Produto & Arquiteto de Software (CLAUDIO-HARD)

---

## 1. Visão Geral & "Mecanismo Único"
O **ProfitBridge AI** resolve a hemorragia de lucro em e-commerces que continuam gastando em Google Ads para produtos com estoque crítico ou margem negativa.

**O Mecanismo Único (The Profit-Lock):**
Diferente de gestores de anúncios humanos ou regras simples do Google, o ProfitBridge cria uma **Ponte de Dados Viva** entre o ERP/Shopify e a API do Google Ads. Ele calcula o "Ponto de Equilíbrio Dinâmico" (Dynamic Breakeven) considerando:
1. Estoque Atual vs. Lead Time de Reposição.
2. Custo de Aquisição (CAC) vs. Margem de Contribuição Real (PIS/COFINS, Gateway, Logística).
3. **Ação:** O motor pausa SKUs automaticamente quando o lucro projetado cai abaixo do "Buffer de Segurança", reativando assim que o estoque é reposto ou o leilão de Ads estabiliza.

---

## 2. User Stories (Hormozi Style)
*   **Como dono de e-commerce**, eu quero que meus anúncios parem de rodar assim que eu tiver menos de 5 unidades de um produto vencedor, para que eu não gaste dinheiro gerando cliques para uma página de "Avisar quando chegar" e desperdice meu lucro do mês.
*   **Como gestor de tráfego**, eu quero uma ferramenta que monitore a margem líquida de cada SKU em tempo real, para que eu possa provar para o cliente que o ROAS que ele vê no Google é real (lucro no bolso) e não apenas faturamento bruto ilusório.

---

## 3. Arquitetura Técnica

### Fluxo de Dados (Data Pipeline)
1.  **Ingestion Layer:** Webhooks do Shopify (orders/updated, inventory/level_update).
2.  **Processing Engine (The Brain):** 
    *   Calcula o `Gross Profit per SKU`.
    *   Verifica o `Stock Buffer Threshold` (ex: 10% do giro médio diário).
3.  **Action Layer:** Integração com Google Ads API (Mutate AdGroup/Criterion) para alternar o status `PAUSED` / `ENABLED`.

### Definição do Buffer de Estoque (Safe Threshold)
O sistema não espera chegar a zero. Ele usa uma fórmula de **Estoque de Segurança Preditivo**:
`Threshold = (Vendas_Medias_7d * Lead_Time_Fornecedor) + Margem_Erro_20%`

---

## 4. Funcionalidades Core (MVP)
*   **Dashboard de Margem Real:** Input de custos (COGS) por SKU via CSV ou integração.
*   **Shopify-Google Sync:** Mapeamento automático de IDs de produtos entre as plataformas.
*   **O "Kill Switch":** Regra de automação que pausa anúncios baseada em:
    *   Estoque < X.
    *   CPA > Margem de Contribuição.
*   **Relatório de "Lucro Salvo":** Painel que mostra quanto orçamento foi economizado ao pausar anúncios de produtos sem estoque.

---

## 5. Roadmap de 8 CICLOS

### Ciclo 1: Fundação & Conectividade
*   Setup do ambiente e autenticação OAuth2 (Shopify/Google).
*   Script de extração de SKUs e match de IDs.

### Ciclo 2: O Motor de Cálculo (Margem Dinâmica)
*   Interface para input de custos fixos/variáveis por SKU.
*   Cálculo de Breakeven ROAS por produto.

### Ciclo 3: O Kill Switch (Alpha)
*   Implementação da lógica de pausa automática via API.
*   Logs de execução para auditoria manual.

### Ciclo 4: Inteligência de Estoque
*   Cálculo de velocidade de vendas (Run-rate).
*   Alertas de "Estoque Crítico Próximo" via WhatsApp/Email.

### Ciclo 5: Otimização de Lances (Bid Adjuster)
*   Em vez de apenas pausar, reduzir lances em 50% quando o estoque baixar de um nível intermediário.

### Ciclo 6: Atribuição de Lucro (Analytics)
*   Dashboard comparando ROAS da plataforma vs. Lucro Real (ProfitBridge View).

### Ciclo 7: Expansão de Canais (Meta Ads)
*   Integração da mesma lógica para Facebook/Instagram Ads.

### Ciclo 8: Escala & Auto-Healing
*   IA para prever quando o estoque acabará baseado em sazonalidade.
*   Abertura para beta testers públicos.

---

## 6. Definição de Pronto (DoR/DoD)
*   **Definition of Ready (DoR):** API Tokens validados e documentação de COGS fornecida pelo cliente.
*   **Definition of Done (DoD):** O sistema deve pausar um anúncio no Google Ads em menos de 5 minutos após o estoque no Shopify atingir o limite definido, sem intervenção humana.
