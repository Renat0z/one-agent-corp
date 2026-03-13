# Department of Portfolio
**One Agent Corp — Swarm OS v6.0**

> *"A fábrica não é julgada pelo que constrói. É julgada pelo que decide matar."*

---

## Missão

Avaliar mensalmente a saúde comercial de cada projeto ativo da fábrica.
Produzir decisões binárias: SCALE, OPTIMIZE, FIX_RETENTION ou KILL.
Realocar capacidade da fábrica para projetos com maior sinal de receita.

**Este departamento opera com dados — nunca com intuição ou esforço investido.**

---

## Revenue-ICE Score (aplicado mensalmente por projeto)

| Dimensão | Pergunta | Peso |
|----------|----------|------|
| MRR_momentum | MRR está crescendo, flat ou declinando? | 40% |
| Lead_velocity | Leads qualificados aumentando semana a semana? | 30% |
| Churn_health | Churn mensal < 5%? | 20% |
| PMF_signal | Clientes recomendam? NPS > 30? | 10% |

---

## Decision Rules

### SCALE
```
Condição: MRR crescendo + leads saudáveis + churn < 5%
Ação:     Alocar máxima capacidade da fábrica. Este é o vencedor.
          Dobrar o canal de distribuição vencedor.
Script:   npx tsx scripts/orchestrator.ts --chain=flow --project={id}
```

### OPTIMIZE
```
Condição: MRR flat + leads saudáveis + churn < 5%
Ação:     Problema de conversão. Corrigir onboarding ou pricing.
          NÃO aumentar gasto em aquisição até conversão melhorar.
Script:   npx tsx scripts/flow-intelligence.ts --project={id}
```

### FIX_RETENTION
```
Condição: MRR declinando OU churn > 5%
Ação:     PARAR toda nova aquisição. Corrigir produto/onboarding primeiro.
          Escalar com churn alto = encher balde furado.
Script:   npx tsx scripts/flow-intelligence.ts --project={id}
```

### KILL
```
Condição: 3 meses consecutivos sem crescimento de MRR E sem sinal de PMF
Ação:     Matar o projeto. Redirecionar capacidade para projetos SCALE.
          Matar rápido é habilidade. Custo afundado não é razão para continuar.
Script:   Atualizar context.json: status = "killed"
          Remover de session.active_projects em CLAUDE.md
```

---

## Protocolo de Revisão (MRR Review Gate — 30 dias pós-deploy)

### Fase 1 — Ler os Números
```
Fonte: workspace/{projectId}/context.json → campo revenue_snapshot
Extrair:
  - MRR atual: $X
  - Leads no ciclo: N
  - Churn: X%
  - NPS (se disponível): X
```

### Fase 2 — Aplicar Decision Rule
```
Não há análise nesta fase. É pattern matching puro:
  revenue_snapshot → match com uma das 4 regras → decisão
```

### Fase 3 — Executar
```
SCALE/OPTIMIZE/FIX: Atualizar context.json → rodar script
KILL: Atualizar context.json status="killed" → atualizar CLAUDE.md session
```

---

## CEo Gate per Cycle

Após toda fase MEASURE do loop Build→Launch→Measure→Iterate, responder:
```
1. MRR cresceu? → quanto?
2. Leads cresceram? → de qual canal?
3. O que UMA coisa moveu mais a agulha?
4. O que UMA coisa deve ser morta imediatamente?
```
Respostas vão para `workspace/{projectId}/context.json` → campo `revenue_snapshot`.

---

## Portfolio Matrix (multi-projetos)

```
Projeto A → Revenue-ICE Score → SCALE   → max capacity
Projeto B → Revenue-ICE Score → OPTIMIZE → fix conversion
Projeto C → Revenue-ICE Score → KILL    → free capacity → Projeto D
```

A fábrica roda múltiplos produtos. Nem todos merecem a mesma atenção.
Capacidade é alocada por sinal de receita — não por esforço já investido.

---

## Output Produzido

```
workspace/{projectId}/portfolio/monthly-review.md  → diagnóstico + decisão
workspace/{projectId}/context.json                 → revenue_snapshot atualizado
                                                      next_cycle_priority atualizado
```

---

## Protocolo de Ativação

```bash
# Revisão de portfolio / decisão de scale-optimize-kill
npx tsx scripts/strategy-review.ts --project={id}

# Análise de flow após decisão
npx tsx scripts/orchestrator.ts --chain=flow --project={id}
```

---

## Regras Críticas

1. **Dados apenas**: Decisões baseadas em revenue_snapshot. Nunca em "potencial" ou "esforço".
2. **Kill rápido**: 3 meses sem sinal = kill obrigatório. Não há exceções por "quase lá".
3. **Churn primeiro**: Churn > 5% congela toda aquisição nova. Sem exceções.
4. **Um vencedor**: Quando há SCALE, toda capacidade vai para ele. Não divide com projetos fracos.
5. **Capacity freeing**: Todo KILL libera capacidade. É um resultado positivo, não uma derrota.

---

**Department of Portfolio v1.0** | Owner: strategy-review.ts | Trigger: 30 dias pós-deploy
