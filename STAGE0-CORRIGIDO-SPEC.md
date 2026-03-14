# SPEC: Stage 0 Corrigido (Revenue-Focused, Reality-Validated)

## Contexto
O Stage 0 atual é um "idea-generation machine" sem validação real.
O board de especialistas recomendou:
- Niches PRÉ-VALIDADOS com ICP específico + dor + competidor + CAC
- Validação com HUMANOS REAIS (15+ calls em 2 dias)
- PDCA rigoroso (meta, resultado, lacuna)
- Five Forces analysis + Grand Slam Offer design
- **ProfitBridge AI = AVANÇAR | ShowUp Hero e Content-to-Contract = ARQUIVAR**

---

## 📋 Entregáveis: 4 Scripts Novos

### 1. `stage0-pre-validated-niches.ts`
**Propósito:** Base de dados estruturada de niches já validados

```typescript
interface ValidatedNiche {
  id: string
  name: string
  icp: {
    title: string
    company_size: string
    industry: string
  }
  pain: {
    description: string
    frequency: "DAILY" | "WEEKLY" | "MONTHLY"
    cost_per_month: number // validado em X calls reais
    sources: string[]
  }
  competitors: Array<{
    name: string
    pricing_per_month: number
    primary_feature: string
    weakness: string
  }>
  distribution: {
    primary_channel: string
    secondary_channels: string[]
    cac_estimated: number
  }
  unit_economics: {
    arpu: number
    ltv_months: number
    ltv_total: number
    ltv_cac_ratio: number
  }
  validation_score: number // 0-10 (baseado em # de calls reais)
  five_forces: {
    threat_of_entrants: "LOW" | "MEDIUM" | "HIGH"
    bargaining_power_buyers: "LOW" | "MEDIUM" | "HIGH"
    bargaining_power_suppliers: "LOW" | "MEDIUM" | "HIGH"
    threat_of_substitutes: "LOW" | "MEDIUM" | "HIGH"
    rivalry: "LOW" | "MEDIUM" | "HIGH"
    overall_attractiveness: number
  }
}
```

**Exemplos Pré-validados:**
1. **profitbridge-ecommerce**: Shopify stores, Ads × Estoque
2. **realestate-brokers**: Agências, no-shows × comissões
3. **medical-clinics**: Clínicas, no-shows × receita
4. **saas-csm**: SaaS customer success, churn × engagement

---

### 2. `stage0-reality-validation.ts`
**Propósito:** Rodar PDCA real: 15 calls em 2 dias com estrutura

**Workflow:**
1. Receber `niche_id`
2. Listar 20 possíveis ICPs (LinkedIn, Twitter, Reddit keywords)
3. Gerar email/DM de outreach personalizado
4. Agendar calls via Calendly
5. Rodar "interview script" padronizado
6. Registrar respostas estruturadas

**Questions:**
```
1. "Qual é o seu papel?"
2. "[Problema específico] — você já enfrentou?"
3. "Quando isso custou dinheiro para você?"
4. "Quanto por mês?"
5. "Você já tentou resolver como?"
6. "Qual ferramenta usa? Quanto custa?"
7. "Se eu resolvesse isso em 1 dia, quanto pagaria?"
8. (Mockup) "Seria assim?"
```

**Output JSON:**
```typescript
interface CallRecord {
  date: string
  icp_name: string
  icp_role: string
  pain_rating: number // 1-10
  pain_cost_monthly: number
  current_solution: string
  willingness_to_pay: number
  feedback: string
  status: "QUALIFIED" | "NEEDS_PIVOT" | "NOT_FIT"
}
```

**Resultado Final:**
- % resposta: 20 outreach → 15 calls
- # com dor >= 8/10
- Média de custo ($)
- % que pagariam
- Recomendação: QUALIFICADO / PIVOTAR / ARQUIVAR

---

### 3. `stage0-pdca-cycle.ts`
**Propósito:** PDCA rigoroso de Falconi

```
META: "Validar se [niche] tem LTV:CAC >= 5:1 com Dor >= 8/10 em 7+ das 15 calls"

RESULTADO ATUAL:
- Calls agendadas: X / 15
- Dor >= 8/10: Y / 7 (alvo)
- Willingness to pay: Z%

LACUNA = META - RESULTADO

PLANO:
- Quem: [pessoa]
- O quê: [ação]
- Quando: [ciclo]
- Métrica: [número]

EXECUÇÃO → CHECK → ACT
```

**Output:**
- Documento Markdown com PDCA
- Gráfico de progresso (Burndown)
- Recomendação: GO / PIVOTAR / NO-GO

---

### 4. `stage0-five-forces-analysis.ts`
**Propósito:** Análise de Porter (Five Forces) + Value Chain

**Output:**
```typescript
interface FiveForces {
  threat_of_entrants: { rating: string; analysis: string; time_to_replicate: string }
  bargaining_power_buyers: { rating: string; analysis: string; switching_cost: string }
  bargaining_power_suppliers: { rating: string; analysis: string; dependencies: string[] }
  threat_of_substitutes: { rating: string; analysis: string; substitutes: string[] }
  rivalry: { rating: string; analysis: string; major_competitors: string[] }
  overall_attractiveness: number // 0-10
  value_chain_moat: string // "qual atividade é difícil de copiar"
}
```

---

## 🔄 Nova Arquitetura do Stage 0

```
stage0-pre-validated-niches.ts
        ↓
    (niches)
        ↓
stage0-reality-validation.ts
        ↓
    (ValidationReport: 15 calls)
        ↓
stage0-pdca-cycle.ts
        ↓
    (PDCA document + GO/NO-GO)
        ↓
stage0-five-forces-analysis.ts
        ↓
    (Five Forces + moat)
        ↓
final-gate0-decision.ts (melhorado)
        ↓
    (Decision doc final integrado)
```

---

## ✅ Critério de Sucesso

Cada niche que sai do stage0 DEVE ter:
- ✅ 15+ calls com pessoas reais (documentado)
- ✅ Dor >= 8/10 confirmado em 7+ pessoas
- ✅ Competidores identificados com preço REAL
- ✅ Five Forces mapeada
- ✅ LTV:CAC >= 3:1 calculado com números reais
- ✅ Decisão GO/PIVOTAR/NO-GO com fundamento (não achismo)

**Meta:** Qualidade > Quantidade. Melhor 1 niche bem validado que 10 genéricos.

---

## 📝 Mudanças no orchestrator.ts

Adicionar à registry:
```typescript
{
  id: "stage0-niches",
  script: "scripts/stage0-pre-validated-niches.ts",
  description: "Stage 0 — Niches pré-validados",
  chains: ["stage0", "all"],
},
{
  id: "stage0-reality-validation",
  script: "scripts/stage0-reality-validation.ts",
  description: "Stage 0 — Validação REAL com 15 calls",
  chains: ["stage0", "all"],
  dependencies: ["stage0-niches"],
},
{
  id: "stage0-pdca-cycle",
  script: "scripts/stage0-pdca-cycle.ts",
  description: "Stage 0 — PDCA rigoroso",
  chains: ["stage0", "all"],
  dependencies: ["stage0-reality-validation"],
},
{
  id: "stage0-five-forces",
  script: "scripts/stage0-five-forces-analysis.ts",
  description: "Stage 0 — Five Forces + Value Chain",
  chains: ["stage0", "all"],
  dependencies: ["stage0-pdca-cycle"],
},
```

Remove: `stage0-next-project.ts` (era gerador de ideias genéricas)

---

## 🚀 Como Usar o Stage 0 Corrigido

```bash
# Opção 1: Listar niches pré-validados
npx tsx scripts/stage0-pre-validated-niches.ts --list

# Opção 2: Validar um niche específico (15 calls em 2 dias)
npx tsx scripts/stage0-reality-validation.ts --niche=profitbridge-ecommerce

# Opção 3: Rodar PDCA para o niche
npx tsx scripts/stage0-pdca-cycle.ts --niche=profitbridge-ecommerce

# Opção 4: Analisar Five Forces
npx tsx scripts/stage0-five-forces-analysis.ts --niche=profitbridge-ecommerce

# Opção 5: TUDO junto via orchestrator
npx tsx scripts/orchestrator.ts --chain=stage0 --niche=profitbridge-ecommerce
```

---

## 📊 Exemplo de Output Final

```markdown
# Stage 0 — PROFITBRIDGE ECOMMERCE — DECISION DOC

## Reality Validation (15 calls)
✅ 20 outreach → 15 calls agendadas (75% response rate)
✅ 9 confirmaram dor >= 8/10 (requer 7+)
✅ Media de perda: $2,847/mês (range: $1k-$8k)
✅ 8 disseram "sim, pagaria $500+"

## PDCA Cycle
META: LTV:CAC >= 5:1, Dor >= 8/10 em 7+
RESULTADO: LTV:CAC = 6.2:1, Dor média = 8.3/10 em 9 pessoas
LACUNA: POSITIVA — está acima do alvo

## Five Forces Analysis
- Threat of Entrants: MEDIUM (6 meses para replicar)
- Bargaining Power of Buyers: HIGH (podem sair para GoHighLevel)
- Bargaining Power of Suppliers: MEDIUM (Meta API está estável)
- Threat of Substitutes: MEDIUM (Revealbot, TripleWhale parcial)
- Rivalry: MEDIUM (nicho específico, não saturado)
**Overall Attractiveness: 7/10**

## Value Chain Moat
"Integração exclusiva entre Shopify inventory + Meta ads + Profit margin analysis"
(Tempo de cópia: 6-9 meses)

## VEREDICTO
✅ **GO** — Validado com fundamento real
- Dor monetizável confirmada
- Disposição a pagar validada
- Competição superável
- Janela de 18 meses aberta

## Próxima Ação
Semana 1-2: MVP (Shopify + Meta apenas)
Semana 3-6: Grand Slam Offer + Beta customers
Semana 7-12: Blitzscale para 100+ clientes
```

---

## 🎯 Diferença: ANTES vs DEPOIS

| Aspecto | ANTES (Fraco) | DEPOIS (Corrigido) |
|---|---|---|
| **Fonte de Nichos** | Lista genérica (9 opções) | Base de dados pré-validada + calls reais |
| **Validação** | Gemini simula pesquisa | 15 humanos reais em 2 dias |
| **Métrica de Dor** | "Presumido" | Número real: $X/mês de X pessoas |
| **Competidores** | Knowledge cutoff (Feb 2025) | Preço real, features atuais, fraquezas |
| **CAC** | Estimado | Calculado com canais reais |
| **LTV:CAC** | Teórico | Validado em 7+ calls |
| **Decision Gate** | Achismo + frameworks bonitos | 4 frameworks + dados reais |
| **Saída** | 3 ideias genéricas | 1 niche ultra-validado (GO) ou feedback estruturado (PIVOTAR/NO-GO) |

**Resultado:** Menos ideias, mas TODAS com fundamento real. Menos tempo em desenvolvimento, mais tempo em validação.
