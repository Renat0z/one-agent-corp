# Department of Revenue Culture
**One Agent Corp — Swarm OS v6.0**

> *"Projetos não pagam contas. MRR paga."*

---

## Missão

Garantir que todo projeto que entra na fábrica passa pelo Revenue Filter antes de qualquer linha de código.
Validar ICP, canal de distribuição, unit economics e willingness-to-pay.
Este departamento bloqueia projetos sem viabilidade comercial — antes que consumam capacidade da fábrica.

**Este departamento é ativado ANTES do projeto entrar no pipeline.** Não depois.

---

## North Star

A fábrica tem **dois indicadores de sobrevivência**:
1. **MRR** — Monthly Recurring Revenue (dinheiro recorrente entrando)
2. **Leads** — Prospects qualificados no pipeline (MRR futuro)

Toda decisão do departamento é avaliada contra:
> "Isso move MRR ou Leads? Se não — por que estamos fazendo?"

---

## Revenue Filter — 4 Gates Obrigatórios

Nenhum projeto entra na fábrica sem passar todos os 4 gates.
**Falhar em qualquer gate = projeto vai para backlog, não para pipeline.**

### Gate 1 — Quem Paga?
```
Pergunta:  Quem é a pessoa exata que vai pagar por isso, e por quê agora?
Requerido: ICP nomeado com dor específica
Reprovado: "Pequenas empresas que querem economizar tempo"
Aprovado:  "Fundadores de SaaS com 3-15 funcionários que perdem leads porque
            o CRM não está conectado ao WhatsApp"
```

### Gate 2 — Willingness to Pay
```
Pergunta:  Há evidência de que esse ICP já paga por soluções nessa categoria?
Requerido: Concorrente existe E cobra dinheiro (mesmo que produto ruim)
Reprovado: "Nenhum concorrente encontrado — oceano azul!"
Nota:      Sem concorrente = sem demanda validada. Oceano azul = sem mercado.
```

### Gate 3 — Canal de Distribuição
```
Pergunta:  Qual é o canal ESPECÍFICO para trazer os primeiros 10 clientes pagantes?
Requerido: Canal nomeado com estimativa de CAC
Opções:    [SEO, Product-led growth, Cold outreach B2B, Community,
            Marketplace listing, Partnership]
Reprovado: "Vamos fazer marketing"
Aprovado:  "Cold outreach no LinkedIn para fundadores de SaaS →
            100 mensagens/semana → est. 3% conversão = 3 trials/semana"
```

### Gate 4 — Unit Economics
```
Pergunta:  Os números funcionam na escala mínima?
Requerido: LTV > 3x CAC. Payback period < 12 meses.

LTV  = ARPU × avg_customer_lifetime_months
CAC  = total_acquisition_cost / new_customers
Regra: LTV / CAC >= 3
Regra: CAC_payback_months <= 12
```

---

## SaaS Metrics — Dicionário Operacional

Estas são métricas de sobrevivência. Se um output de departamento não move nenhuma delas — questione o valor.

### Primárias
```
MRR (Monthly Recurring Revenue)
  = soma de todas as assinaturas ativas × preço mensal
  Sinal: MRR crescendo = fábrica saudável
         MRR flat = problema de distribuição
         MRR caindo = problema de churn

Leads (Prospects Qualificados)
  = prospects que demonstraram intenção (signup, trial, demo request)
  Por quê: Leads × taxa_de_conversão = novo MRR
  Sinal: Lead flow secando = canal de aquisição falhando. Corrigir antes de afetar MRR.
```

### Secundárias
```
CAC (Customer Acquisition Cost)
  = total_gasto_marketing_e_vendas / novos_clientes_adquiridos
  Perigo: CAC subindo mais rápido que ARPU = unit economics quebrando

LTV (Lifetime Value)
  = ARPU / monthly_churn_rate
  Perigo: LTV < 3x CAC = fábrica perdendo dinheiro por cliente

Churn
  = clientes_perdidos_no_mês / clientes_início_do_mês
  Perigo: Churn mensal > 5% = problema de product-market fit, não de growth
  Nota: Não dá para crescer saindo de um problema de churn. Corrigir retenção antes de escalar aquisição.

Activation Rate
  = % de usuários trial/free que chegam ao "aha moment" (primeiro valor)
  Perigo: Activation < 30% = onboarding quebrado, não o produto

Payback Period
  = CAC / MRR_por_cliente
  Target: < 12 meses para SaaS saudável
```

---

## ICP-First Development

Todo produto da fábrica tem **UM ICP nomeado**.
Features são construídas apenas se servem diretamente as 3 principais dores desse ICP.

### Template de Definição de ICP
```yaml
icp:
  who: "Cargo / papel / tipo de empresa"
  company_size: "1-10 / 10-50 / 50-200 funcionários"
  primary_pain: "O único problema que pagariam para resolver hoje"
  current_solution: "O que usam agora? (planilha, concorrente, processo manual)"
  willingness_to_pay: "Orçamento mensal estimado para essa categoria"
  where_they_hang_out: "Comunidades, ferramentas, plataformas, eventos"
```

### PMF Checkpoint (antes de qualquer decisão de scaling)
```
Sinais de PMF Forte:
  ✓ Clientes reclamam quando você remove uma feature
  ✓ Clientes indicam outros sem ser pedidos
  ✓ Churn causado por cortes de orçamento, não insatisfação
  ✓ NPS > 40

Sinais de PMF Fraco:
  ✗ Clientes cancelam após trial sem motivo claro
  ✗ Clientes estão "interessados" mas não pagam
  ✗ Feature requests são todos diferentes (sem necessidade central clara)

Regra: NÃO escale aquisição antes de ter PMF forte. Corrija o produto primeiro.
```

---

## Seleção de Nicho B2B

Os micro-SaaS mais lucrativos são B2B, verticais e "chatos".
"Chato" = o cliente tem uma dor operacional recorrente que vai pagar para remover para sempre.

### Perfil de Nicho Ideal
```
market_size:    Pequeno o suficiente para grandes players ignorarem.
                Grande o suficiente para atingir $10k MRR.
pain_intensity: Cliente perde tempo ou dinheiro diariamente sem a solução
switching_cost: Uma vez integrado, difícil de sair (lock-in de dados, dependência de workflow)
competition:    1-3 concorrentes mediocres → demanda validada + espaço para ganhar
```

### Verticais de Alto Sinal
- Automação de marketing para setor específico (ex: imobiliário, clínicas)
- Integrações de vendas/CRM (WhatsApp + CRM, email + CRM)
- Operações/compliance para nichos regulados (saúde, finanças, jurídico)
- Ferramentas para criadores com necessidade recorrente de workflow
- Ops de e-commerce (estoque, envio, automação de atendimento)

### Verticais de Baixo Sinal
- Ferramentas genéricas de produtividade (clones de Notion, apps de to-do)
- Apps B2C sem caminho claro de monetização
- Ferramentas para desenvolvedores (churn alto, baixo WTP, constroem o próprio)

---

## Distribution-First Mandate

> "Um produto sem canal de distribuição é um hobby, não um negócio."

Distribuição deve ser desenhada **ANTES** do produto ser construído.
O Department of Growth não é chamado APÓS o lançamento. É chamado PRIMEIRO.

### Canais Obrigatórios por Estágio
```
Pré-lançamento:
  - Build in public (documentar o build para SEO + comunidade)
  - Pré-vender para 3-5 prospects ICP antes de escrever código
  - Entrar e participar em 2 comunidades onde o ICP está

Lançamento:
  - Listing no Product Hunt (visibilidade dia-1)
  - Listings em marketplaces (AppSumo, G2, Capterra, diretórios de nicho relevantes)
  - Batch de cold outreach: 200 mensagens personalizadas para ICP

Pós-lançamento (scale):
  - Identificar o UM canal com melhor CAC → dobrar ele
  - Growth loop product-led: free tier / trial que se vende sozinho
  - Conteúdo SEO para search intent do ICP (long-tail, alta intenção)
  - Integrações com parceiros (aparecer dentro de ferramentas que o ICP já usa)
```

### Anti-Padrões de Distribuição
- Lançar sem plano de distribuição
- Gastar mais de 1 semana em features antes de conseguir o primeiro cliente pagante
- Fazer SEO sem confirmar primeiro que existe search intent orgânico para o ICP
- Depender de "boca a boca" como estratégia (não é estratégia, é resultado)

---

## The Build→Launch→Measure→Iterate Loop

Velocidade só tem valor se é medida. Iteração rápida sem medição é movimento rápido em direções aleatórias.

```
BUILD:    Ship o mínimo que testa a hipótese. Não a feature completa.
LAUNCH:   Coloque na frente de ICP real. Não amigos. Não equipe. ICP real.
MEASURE:  MRR moveu? Leads moveram? Activation melhorou? Só números.
ITERATE:  Dobre o que funcionou. Mate o que não funcionou. Nunca itere por intuição.
```

### Targets de Tempo por Ciclo
```
ideia → primeiro cliente pagante:    < 4 semanas
hipótese → medição:                  < 1 semana
decisão de kill se sem sinal:        máximo 3 meses, então corte
```

---

## Protocolo de Ativação

Este departamento é ativado pelo script:
```bash
npx tsx scripts/orchestrator.ts --chain=project --concept="..." --project={id}
```

O Revenue Filter roda **dentro do script** — não na cabeça do roteador.

### Output Produzido
```
workspace/{projectId}/context.json → campo revenue_snapshot preenchido
workspace/{projectId}/revenue/icp-definition.md → ICP nomeado
workspace/{projectId}/revenue/channel-plan.md → canal de distribuição definido
workspace/{projectId}/revenue/unit-economics.md → LTV/CAC calculados
```

---

**Department of Revenue Culture v1.0** | Owner: orchestrator.ts --chain=project
