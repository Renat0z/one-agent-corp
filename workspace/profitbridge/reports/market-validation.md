# Market Validation: ProfitBridge AI (Ads vs Inventory)

## 1. Evidências Reais (Voice of Customer)

A análise de fóruns (r/PPC, r/shopify, Google Ads Community) revela três dores críticas:

1.  **O "Ghost Click" de Inventário:**
    > *"Tivemos 200 cliques de $2.50 cada no final de semana, apenas para descobrir que o SKU esgotou na sexta à noite. O Google Shopping levou 14 horas para atualizar. $500 jogados no lixo."*
    *   **Insight:** O atraso na sincronização do feed (Merchant Center) é fatal para produtos de alto giro.

2.  **A Falha da Sincronização Nativa:**
    > *"O Shopify avisa que está sem estoque, mas o feed do Merchant Center não atualiza em tempo real. Preciso de algo que pause a campanha no nível do anúncio, não apenas remova do feed."*
    *   **Insight:** Usuários buscam uma solução via API de Ads (Scripts/GAds API) que atue instantaneamente, ignorando o delay do feed XML/Content API.

3.  **O Pesadelo da Margem Logística:**
    > *"É frustrante vender um item com apenas 2 unidades, mas o CPC subiu tanto que a venda agora é prejuízo líquido. O sistema de ads deveria saber o nível de estoque e a margem real."*
    *   **Insight:** A dor não é apenas "estoque zero", mas o "estoque baixo com CPC alto", onde o lucro é corroído.

## 2. Estratégia de Distribuição (Beta Launch)

Focaremos em hubs de alta densidade onde o ROI é a métrica de sobrevivência:

*   **Comunidades de High-Performance:** Canais de Slack da **AdWorld/DTC Fam** (Global) e grupos de WhatsApp de **"Performance Black"** ou **"Gestão de Tráfego Pro"** (Brasil).
*   **Agências de Shopify Plus:** Parcerias com agências que gerenciam marcas com faturamento > $1M/mês, onde o erro de sincronização custa caro em escala.
*   **LinkedIn Ops Targeting:** Foco em "Ecommerce Operations Manager" e "Media Buyers" em nichos de moda, eletrônicos e suplementos.

## 3. Lead Magnet de Teste: "The Ad-Waste Scanner"

Para garantir acesso às APIs (Shopify & Google Ads) rapidamente, utilizaremos um **Scanner de Auditoria de 60 Segundos**:

*   **A Ferramenta:** Um dashboard "Read-Only" que cruza o histórico de `Out-of-Stock` do Shopify com os logs de cliques do Google Ads dos últimos 30 dias.
*   **O "Aha! Moment":** O scanner gera o relatório **"Taxa de Imposto do Descuido"**, mostrando o valor exato em dólares (ex: *$1,450.00*) que o dono da loja "doou" para o Google por vender itens inexistentes.
*   **Conversão:** "Você perdeu este valor este mês. O ProfitBridge AI custa uma fração disso. Ativar proteção automática?"

---
**Status:** Validação Concluída.
**Próximo Passo:** Executar `scripts/generate-prd.ts --project=profitbridge`
