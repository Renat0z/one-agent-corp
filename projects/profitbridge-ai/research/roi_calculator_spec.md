# ROI Calculator Specification (Lead Magnet) - ProfitBridge AI

## 1. O Objetivo (The Hook)
O cliente conecta (ou sobe um CSV) dos seus anúncios e do histórico de estoque. A calculadora cospe um número: **"Você perdeu R$ X.XXX,XX nos últimos 30 dias anunciando produtos sem estoque ou com margem negativa."**

## 2. Input de Dados (Minimal Friction)
Para o Lead Magnet ser efetivo (Hormozi), ele precisa de baixíssima fricção:
- **Opção A (Manual/Rápida):** Usuário preenche 3 campos:
    - Gasto mensal em Ads.
    - % média de ruptura de estoque (out-of-stock).
    - ROAS médio.
- **Opção B (Semi-Automática):** Upload de CSV exportado do Google/Meta Ads + Export de Estoque do Bling/Tiny.

## 3. A Lógica do Cálculo (The Math)
`Wasted Spend = (Ad Spend on Out-of-Stock SKUs) + (Ad Spend on DOI < 2 days)`

`Lost Opportunity = (Wasted Spend * ROAS) - Wasted Spend`

`Total Profit Leak = Wasted Spend + Lost Opportunity`

## 4. UI/UX (Hormozi Strategy)
- **Fase 1: O Diagnóstico.** Gráfico de barras simples: "Investimento Real" vs "Investimento Útil".
- **Fase 2: A Comparação.** "O que você poderia ter feito com esse dinheiro economizado" (ex: contratar 1 estagiário, comprar X novos SKUs).
- **Fase 3: O CTA (The Pitch).** "Pare o sangramento agora. Ative o ProfitBridge AI com 1 clique. [BOTÃO: TESTAR GRÁTIS - GARANTIA 3X]."

---

## 5. Implementation Task List (MVP)

### Task 1: Web-based Calculator Component (React/Next.js)
- [ ] Criar formulário de inputs rápidos.
- [ ] Implementar fórmulas de vazamento de lucro.
- [ ] Gerar visualização de "Profit Leak" em tempo real.

### Task 2: Lead Capture Integration
- [ ] Salvar o resultado e o e-mail do prospect no banco/CRM.
- [ ] Disparo automático: "Seu Relatório de Perda de Lucro está anexo".

### Task 3: CSV Parser (Phase 2 of Lead Magnet)
- [ ] Script para cruzar `Ad_ID` vs `Stock_Status` via upload manual.

---

## 6. Próximo Passo Imediato
Vou criar um protótipo funcional da lógica de cálculo em TypeScript para validarmos os números.
