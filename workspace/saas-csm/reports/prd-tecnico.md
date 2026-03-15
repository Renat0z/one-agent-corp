# PRD TÉCNICO: ProfitBridge AI (v1.0)
**Codinome:** Inventory-Aware Ad Engine  
**Status:** Draft para Ciclo 1  
**Responsável:** VP de Produto & Arquiteto de Software

---

## 1. Visão Geral & "Mecanismo Único"
O **ProfitBridge AI** é um middleware de inteligência operacional que resolve a hemorragia de lucro em e-commerces causada pela desconexão entre o **Estoque Físico (Shopify)** e a **Venda Digital (Google Ads)**.

### O Problema (The Profit Killer)
Anúncios continuam rodando para SKUs com estoque baixo (gerando quebra de grade e experiência negativa) ou estoque zero (gerando cliques pagos que levam a páginas de "Esgotado"), resultando em um desperdício médio de **15% a 22% do orçamento de marketing**.

### O Mecanismo Único: "The Inventory-Margin Bridge"
Diferente de scripts de automação simples, o ProfitBridge utiliza um **Buffer Dinâmico de Segurança** e um **Calculador de Contribuição Marginal** para pausar/retomar anúncios em milissegundos após uma venda, garantindo que o ROAS real seja calculado sobre o lucro líquido disponível, não apenas sobre a receita bruta.

---

## 2. User Stories (Hormozi Style)
*   **Como Dono de E-commerce**, eu quero que meus anúncios parem de queimar dinheiro em produtos que eu não tenho para entregar, para que meu lucro líquido no final do mês seja protegido sem eu precisar olhar planilhas.
*   **Como Gestor de Tráfego**, eu quero uma automação que pause SKUs específicos dentro de campanhas de Performance Max (PMax) assim que o estoque atingir o "limite de segurança", para que eu possa focar na estratégia criativa e não em checar o estoque manualmente todo dia.
*   **Como Operador de Logística**, eu quero que o sistema reative os anúncios instantaneamente assim que eu der entrada em uma nova remessa no Shopify, para que a escala de vendas não sofra atrasos humanos.

---

## 3. Arquitetura Técnica

### Fluxo de Dados de Alta Densidade
1.  **Ingestão:** Webhook `orders/create` e `products/update` do Shopify.
2.  **Processamento:** Engine Node.js valida o SKU contra a tabela de **Margem Dinâmica**.
3.  **Decisão (The Kill Switch):**
    *   `Estoque <= Safe_Threshold` → Dispara comando via Google Ads API para aplicar `ExcludedItem` no Feed de Produtos ou pausar o AdGroup.
    *   `Estoque > Safe_Threshold` → Remove exclusão e retoma lances.
4.  **Sincronização:** Polling de segurança a cada 15 minutos para garantir integridade caso webhooks falhem.

### Definição do Buffer de Estoque (Safe Threshold)
O sistema calcula o "Ponto de Pausa" baseado na **Velocidade de Venda (V-7d)**:
> `Threshold = (Vendas_Ultimos_7_Dias / 7) * Lead_Time_Reposicao`

| SKU Tipo | Lead Time | Venda Diária | Safe Threshold (Pausa) |
| :--- | :--- | :--- | :--- |
| Curva A | 2 dias | 50 unid. | 100 unidades |
| Curva B | 5 dias | 10 unid. | 50 unidades |
| Curva C | 10 dias | 2 unid. | 20 unidades |

---

## 4. Funcionalidades Core (MVP)

### 4.1. Importador de SKUs & Mapeamento
*   Sincronização inicial de catálogo Shopify via GraphQL API.
*   Mapeamento de `Variant ID` (Shopify) para `Item ID` (Google Merchant Center).

### 4.2. Calculadora de Margem Dinâmica
*   Campo de input para **COGS** (Custo da Mercadoria Vendida).
*   Cálculo automático: `Preço de Venda - COGS - Impostos - Gateway = Margem de Contribuição`.
*   Regra: Se `Margem < 10%`, o sistema sugere pausa automática mesmo com estoque alto.

### 4.3. O "Kill Switch" (Automação de Pausa)
*   Integração direta com Google Ads API.
*   Painel de logs mostrando: "SKU #123 pausado às 14:02 por falta de estoque. Economia estimada: $45.00".

---

## 5. Roadmap de 8 Ciclos

| Ciclo | Nome | Entregável Principal | Métrica de Sucesso |
| :--- | :--- | :--- | :--- |
| **1** | Setup & Auth | Integração OAuth2 Shopify + Google Ads | Conexão estável (0 erros) |
| **2** | Data Sync | Espelhamento de estoque em tempo real | Latência < 30 segundos |
| **3** | Logic Engine | Algoritmo de Safe Threshold funcional | Precisão de pausa de 100% |
| **4** | Dashboard | Painel de "Lucro Salvo" (Loss Avoided) | Feedback positivo do usuário |
| **5** | Margin Filter | Pausa baseada em lucratividade do SKU | Aumento de 5% na margem média |
| **6** | PMax Deep Dive | Controle de Assets individuais em PMax | Suporte a campanhas complexas |
| **7** | Multi-Store | Suporte a múltiplas contas e moedas | Escalabilidade de infra |
| **8** | AI Optimizer | Predição de ruptura de estoque via ML | Antecipação de pausa em 24h |

---

## 6. Definição de Pronto (DoR/DoD)

### Definition of Ready (DoR)
*   Credenciais de API de teste (Shopify Partner & Google Ads Developer Token) ativas.
*   Mapeamento de banco de dados (PostgreSQL) definido para SKUs e Logs.

### Definition of Done (DoD)
*   **Funcional:** O sistema deve pausar um anúncio no Google Ads em menos de 2 minutos após o estoque no Shopify chegar a zero.
*   **Segurança:** Dados de faturamento e margem criptografados (AES-256).
*   **QA:** Passar em teste de stress de 1.000 webhooks simultâneos.
*   **Negócio:** Gerar relatório de "Dinheiro economizado" com base no CPC médio do SKU pausado.