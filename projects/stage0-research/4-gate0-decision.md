# GATE 0 — DECISION DOC
## ContractLens — AI Contract Analyzer para Freelancers

---

## Projeto Recomendado
**Nome:** ContractLens
**Categoria:** LegalTech / Productivity SaaS
**Tagline:** *"Veja o que o contrato esconde — antes de assinar."*

---

## Resumo Executivo

ContractLens resolve uma dor de $9/10 para 73M freelancers: assinar contratos com cláusulas abusivas sem poder pagar advogado. O mercado endereçável (SAM $42M) está sub-servido — SpellBook custa $99/mês focado em advogados, e o workaround dominante é colar texto no ChatGPT sem contexto jurídico. Nosso diferencial defensável é o **Red Flag Engine™** com templates contextualizados por tipo de trabalho (dev, design, consultoria), entregando análise em <3 minutos a $29-49/mês — 20x mais barato que o concorrente mais próximo acessível.

---

## Por Que AGORA

- **Janela de 12-18 meses** antes de entrantes sérios chegarem no sweet spot $49-99/mês
- EU AI Act 2026 cria compliance overhead que desincentiva oportunistas
- LLM APIs em custo mínimo (~$0.02-0.08/análise) tornam a margem viável hoje
- Freelancer economy em crescimento pós-pandemia: 73M nos EUA, consciência sobre proteção contratual em alta
- Nossa factory já tem stack validada (Next.js + Stripe + VPS) — time-to-MVP reduzido vs. cold start

---

## Opportunity Score Consolidado

| Dimensão | Score | Justificativa |
|----------|-------|---------------|
| Mercado | 8/10 | SAM $42M, dor 9/10, workaround fraco dominante |
| Competição | 7.5/10 | Concorrentes fora do sweet spot de preço; janela de 12-18m |
| Oferta | 9/10 | Value Equation Hormozi = 90 (máximo no quadrante) |
| **TOTAL** | **8.2/10** | ✅ Acima do threshold de GO (7.0) |

---

## Projeção Financeira

| Métrica | Valor | Base de Cálculo |
|---------|-------|-----------------|
| **Target MRR (12 meses)** | **$9.800** | ~280 clientes × $35 ARPU médio |
| **CAC estimado** | $45 | PLG + comunidades freelancer (sem sales force) |
| **LTV estimado** | $630 | Churn estimado 8%/mês → 12.5 meses médio × $50 ARPU blend |
| **LTV/CAC** | **14x** | Saudável (benchmark: >3x) |
| **Break-even** | **Mês 5** | ~140 clientes paying cobrindo infra + LLM API costs |
| **Gross Margin target** | 78% | Custo variável dominante: LLM API ~$0.05/análise |

> Referência: AI Report Generator atingiu $8.940 MRR com 33 clientes (ARPU $271 B2B). ContractLens mira volume maior com ticket menor — modelo PLG/freemium com conversão self-serve.

---

## Riscos Principais

**1. Comoditização por LLM genérico (GPT-5, Gemini 2.5)**
→ *Mitigação:* Construir moat em templates curados por jurisdição/tipo de contrato nos primeiros 90 dias. Data flywheel: cada contrato analisado melhora os templates. Não competir em "analyze text" — competir em contexto específico de freelancer.

**2. Risco regulatório / disclaimer jurídico**
→ *Mitigação:* Posicionamento explícito como "ferramenta de educação, não aconselhamento jurídico". Disclaimer em cada análise. Parceria com 1-2 advogados freelancers como advisors para validação de templates e credibilidade.

**3. Churn alto por uso episódico (freelancer só precisa quando tem contrato)**
→ *Mitigação:* Adicionar valor contínuo — biblioteca de templates para enviar ao cliente, gerador de adendos, alertas de cláusulas padrão por setor. Transformar de "ferramenta pontual" em "assistente de negócios do freelancer".

---

## Stack Técnico Recomendado

**☑ Monolith (Next.js)**

**Justificativa:** Replicar stack validada do AI Report Generator. Microservices adicionam complexidade operacional sem ganho real até $50K MRR. Componentes core:

```
Frontend:    Next.js 14 + TypeScript + shadcn/ui
Backend:     Next.js API Routes + Prisma ORM
Database:    PostgreSQL (Supabase ou Railway)
LLM:         OpenAI GPT-4o + Anthropic Claude (fallback)
PDF Parse:   pdf-parse + LangChain document loaders
Payments:    Stripe (Subscriptions + metered billing)
Auth:        NextAuth.js
Deploy:      Vercel (frontend) + Railway (DB)
Vector DB:   Pinecone (templates similarity search — fase 2)
```

**Custo infra estimado mês 1-3:** ~$120/mês. Escala para ~$380/mês em 200 clientes.

---

## DECISÃO SUGERIDA

**☑ GO — iniciar Stage 1 (Ideation)**

Score 8.2/10 supera threshold. Dor validada, mercado endereçável real, stack conhecida, janela competitiva aberta. Único ajuste pré-stage: validar disclaimer jurídico com advisor antes do MVP.

---

## Próximos 3 Steps se GO

**1. Kickoff Product + Engineering (Dias 1-3)**
Lançar diretiva para ProductAgent: mapear 10 tipos de cláusula mais reclamados em comunidades freelancer (Reddit r/freelance, Indie Hackers, Twitter/X). Definir MVP scope: upload PDF → 5 red flags → score de risco → recomendação em linguagem simples.

**2. Validação com 20 freelancers antes de escrever código (Dias 3-7)**
Criar Typeform + landing page estática com promessa central. Meta: 20 respostas de freelancers que assinaram contrato problemático nos últimos 12 meses. Critério de GO para MVP: 15/20 dizem "pagaria $29/mês por isso".

**3. Ativar pipeline + primeiro ciclo ICE (Dia 7)**
```typescript
// Criar projeto no pipeline
pipeline.createProject({ name: 'ContractLens', targetMrr: 9800, budget: 14000 })

// Primeiro ciclo: validação de demanda
ceo.execute({
  kind: 'create-cycle',
  hypothesis: 'Freelancers de tech pagariam $29/mês para revisar contratos em 3min',
  minimumTest: 'Landing page + Typeform para 20 freelancers via comunidades',
  targetMetric: 'willingness_to_pay_rate',
  targetValue: 0.75,
  department: 'growth',
  estimatedDuration: '3d',
  iceScore: { impact: 9, confidence: 8, ease: 8 }
})
```

---

*Gate 0 aprovado em 2026-03-12. Próxima revisão: Gate 1 após validação de demanda (estimado 2026-03-19).*
