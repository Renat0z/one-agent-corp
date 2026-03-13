# API Feasibility Spike - ProfitBridge AI

## 1. Google Ads API
- **Endpoint:** `campaigns` / `ad_groups`.
- **Viabilidade:** Alta. O status `PAUSED` ou o ajuste de `budget` via API é instantâneo.
- **Risco:** Delay de dados de conversão (atribuição).
- **Mitigação:** Usar dados de estoque (hard data) como trigger primário, e ROAS (soft data) como secundário.

## 2. Bling / Tiny ERP (Brasil)
- **Endpoint Bling:** `GET /produtos`, `GET /estoques`.
- **Endpoint Tiny:** `POST /produtos.pesquisa`, `POST /produto.obter.estoque`.
- **Viabilidade:** Média/Alta. Bling tem Webhooks para alteração de estoque, o que é PERFEITO para nós.
- **Risco:** Rate limits em contas básicas de ERP.
- **Mitigação:** Cache de inventário e polling inteligente.

## 3. Meta Ads API
- **Viabilidade:** Alta.
- **Risco:** Quebra da "Learning Phase".
- **Mitigação:** Em vez de PAUSAR, reduzir o lance (bid) ou o orçamento em 80% para manter o anúncio "vivo" mas sem escala enquanto o estoque está baixo.
