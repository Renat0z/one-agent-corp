# Documentação de Scripts - One Agent Corp

Esta documentação descreve os scripts disponíveis no diretório `/scripts` e como utilizá-los para gerenciar o ciclo de vida dos projetos, implantação e inteligência de negócios.

Sempre que criar um arquivo novo em '/scripts' adicione também a função dela neste documento.

---

## 🏗️ Utilidades de Sistema

### **Batch Read Files**
Lê múltiplos arquivos e consolida o conteúdo com numeração de linhas para fornecer contexto a IAs.
- **Comando:** `node scripts/batch_read_files.cjs <arquivo1> <arquivo2> ...`
- **Parâmetros:** Lista de caminhos de arquivos (relativos ou absolutos).

### **Action Executor**
Executa ações aprovadas pelo board de estratégia que possuem scripts associados.
- **Comando:** `npx tsx scripts/action-executor.ts --project=<id-do-projeto>`
- **Parâmetros:** `--project` (ID do projeto no workspace).

### **Cost Tracker**
Monitora e reporta os custos de API (OpenAI, Anthropic, etc) associados a um projeto.
- **Comando:** `npx tsx scripts/cost-tracker.ts --project=<id-do-projeto>`

---

## 📈 Inteligência e Estratégia (Stage 0 & Flow)

### **Market Scout (Stage 0 Research)**
Realiza pesquisa de mercado, análise de tendências e stress test (Red Team) para novas ideias através do **Dept. of Market Intelligence**.
- **Comando Direto:** `npx tsx scripts/market-scout.ts`
- **Via Orquestrador:** `npx tsx scripts/orchestrator.ts --chain=stage0 --project=<id>`
- **Saída:** Gera relatórios em `projects/stage0-research/`.

### **Flow Intelligence**
Analisa o estado atual do projeto, identifica gargalos e sugere ações de crescimento (ICE score) através do **Dept. of Flow Intelligence**.
- **Comando Direto:** `npx tsx scripts/flow-intelligence.ts --project=<id-do-projeto>`
- **Via Orquestrador:** `npx tsx scripts/orchestrator.ts --chain=flow --project=<id>`
- **Requisito:** Requer um `bottleneck-report.md` ou dados de auditoria prévios.

### **Strategy Review**
Submete o plano de ações do Flow Intelligence ao **Dept. of Strategy** (Board: Dalio, Goldratt, Porter) para aprovação.
- **Comando Direto:** `npx tsx scripts/strategy-review.ts --project=<id-do-projeto>`
- **Via Orquestrador:** Faz parte da chain `--chain=flow` ou `--chain=full`.
- **Requisito:** Necessita do arquivo `growth-actions.json` gerado pelo Flow Intelligence.

---

## 🚀 Ciclo de Vida e Execução

### **Start Cycle 1**
Inicializa o primeiro ciclo de um projeto (focado em conectividade/MVP).
- **Comando:** `npx tsx scripts/start-cycle1.ts`

### **Advance to Cycle 2**
Evolui o projeto do ciclo de conectividade para o ciclo de inteligência/core.
- **Comando:** `npx tsx scripts/advance-to-cycle2.ts`

### **Complete Cycle 1**
Finaliza formalmente o Ciclo 1, movendo o status para "COMPLETED".
- **Comando:** `npx tsx scripts/complete-cycle1.ts`

### **Auto Audit**
Realiza uma auditoria automática do projeto através do **Dept. QA & Audit** para verificar saúde do código e progresso.
- **Comando Direto:** `npx tsx scripts/auto-audit.ts --project=<id-do-projeto>`
- **Via Orquestrador:** `npx tsx scripts/orchestrator.ts --chain=audit --project=<id>`

---

## 🚢 Deploy e Infraestrutura

### **Deploy Full Stack**
Executa o deploy completo (Frontend + Backend) em ambiente de produção/VPS.
- **Comando:** `npx tsx scripts/deploy-full-stack.ts --project=<id-do-projeto>`
- **Via Orquestrador:** `npx tsx scripts/orchestrator.ts --chain=deploy --project=<id>`

### **Setup VPS**
Prepara uma VPS virgem para receber os serviços do One Agent Corp (Docker, Nginx, etc).
- **Comando:** `npx tsx scripts/setup-vps.ts --host=<ip> --user=<user>`

### **Deploy ROI / ProfitBridge**
Scripts especializados para deploy de produtos específicos da holding.
- **ROI:** `bash scripts/deploy-roi.sh`
- **ProfitBridge:** `npx tsx scripts/deploy-profitbridge.ts`

---

## 🔄 Pipelines Integrados

### **Pipeline Full Run**
Executa o fluxo completo (Multi-departamental): Auditoria -> Flow Intelligence -> Strategy Review -> Action Execution.
- **Comando:** `npx tsx scripts/orchestrator.ts --chain=full --project=<id-do-projeto>`

### **Generate PRD**
Gera o Product Requirements Document baseado no Stage 0 através do **Dept. Product**.
- **Comando:** `npx tsx scripts/generate-prd.ts --project=<id-do-projeto>`

---

## 🎯 Referência Rápida: Departamentos via Orquestrador

### Tabela de Chains e Departamentos

| Chain | Departamentos | Comando | Descrição |
|-------|--------------|---------|-----------|
| `stage0` | Market Intelligence | `npx tsx scripts/orchestrator.ts --chain=stage0` | Pesquisa completa: Tendências → Red Team → Competitivo → Oferta → Gate 0 |
| `flow` | Flow Intelligence + Strategy | `npx tsx scripts/orchestrator.ts --chain=flow --project=<id>` | Mapa de gargalos → Aprovação estratégica |
| `audit` | QA & Audit | `npx tsx scripts/orchestrator.ts --chain=audit --project=<id>` | Validação técnica → Reflexão → Custos |
| `full` | Flow + Audit (Completo) | `npx tsx scripts/orchestrator.ts --chain=full --project=<id>` | Fluxo de inteligência + auditoria tudo junto |
| `cycle` | Product + Ciclos | `npx tsx scripts/orchestrator.ts --chain=cycle --project=<id>` | Pesquisa → PRD → Ciclo 1 → Pipeline → Ciclo 2 |
| `deploy` | Deploy & Infraestrutura | `npx tsx scripts/orchestrator.ts --chain=deploy --project=<id>` | Build → Deploy → Health Check → Launch |
| `project` | Lifecycle Completo | `npx tsx scripts/orchestrator.ts --chain=project --project=<id>` | Ciclo de vida total do projeto + auditoria final |
| `all` | Todos os departamentos | `npx tsx scripts/orchestrator.ts --chain=all --project=<id>` | Executa todas as chains em sequência |

---

## 🏛️ Departamentos & Scripts por Chain

### 1️⃣ **Dept. of Market Intelligence** (Stage 0 Research)
Valida dores, tendências e oportunidades antes da construção.
- **Chain:** `stage0`
- **Scripts na chain:** 
  - `stage0-next-project.ts` (Pesquisa completa)
  - `market-scout.ts` (Market Intelligence)
  - `generate-prd.ts` (Product)
- **Executar:** `npx tsx scripts/orchestrator.ts --chain=stage0`

### 2️⃣ **Dept. of Flow Intelligence**
Mapeia gargalos, calcula ICE scores, sugere ações de crescimento.
- **Chain:** `flow` (primária)
- **Scripts na chain:**
  - `flow-intelligence.ts` (Análise de gargalos)
  - `strategy-review.ts` (Board aprova)
  - `action-executor.ts` (Executa ações aprovadas)
- **Executar:** `npx tsx scripts/orchestrator.ts --chain=flow --project=<id>`

### 3️⃣ **Dept. of Strategy** (The Board)
Revisão e aprovação de ações por Ray Dalio, Eliyahu Goldratt, Michael Porter.
- **Chain:** `flow`, `full`
- **Script:** `strategy-review.ts`
- **Dependência:** Necessita de `growth-actions.json` do Flow Intelligence
- **Executar como parte de:** `npx tsx scripts/orchestrator.ts --chain=flow --project=<id>`

### 4️⃣ **Dept. of QA & Audit**
Valida integridade técnica, reflete sobre aprendizado, monitora custos.
- **Chain:** `audit`
- **Scripts na chain:**
  - `auto-audit.ts` (Auditoria técnica)
  - `post-cycle-reflection.ts` (Reflexão e aprendizado)
  - `cost-tracker.ts` (Monitoramento de custos)
- **Executar:** `npx tsx scripts/orchestrator.ts --chain=audit --project=<id>`

### 5️⃣ **Dept. of Product**
Transforma pesquisa em requisitos, gera PRD e histórias de usuário.
- **Chain:** `stage0`, `cycle`
- **Script:** `generate-prd.ts`
- **Dependência:** Requer análise do Stage 0
- **Executar como parte de:** `npx tsx scripts/orchestrator.ts --chain=cycle --project=<id>`

### 6️⃣ **Dept. of Engineering & Project Lifecycle**
Gerencia ciclos de desenvolvimento e validação.
- **Chain:** `cycle`
- **Scripts na chain:**
  - `start-cycle1.ts` (Inicializa Ciclo 1)
  - `pipeline-full-run.ts` (Pipeline completo do ciclo)
  - `complete-cycle1.ts` (Finaliza Ciclo 1)
  - `advance-to-cycle2.ts` (Evolui para próximo ciclo)
- **Executar:** `npx tsx scripts/orchestrator.ts --chain=cycle --project=<id>`

### 7️⃣ **Dept. of Infrastructure & Deployment**
Deploy de aplicações e gerenciamento de infraestrutura.
- **Chain:** `deploy`
- **Scripts na chain:**
  - `deploy-profitbridge.ts`
  - `deploy-full-stack.ts`
  - `check-deploy.ts`
  - `launch-ai-report-generator.ts`
- **Executar:** `npx tsx scripts/orchestrator.ts --chain=deploy --project=<id>`

---

## 🎮 Guia de Uso do Orchestrator

### Exemplo 1: Primeira vez com um novo projeto (Pesquisa Completa)
```bash
# Stage 0: Pesquisa + validação
npx tsx scripts/orchestrator.ts --chain=stage0

# Resultado: 5 arquivos markdown em projects/stage0-research/
```

### Exemplo 2: Analisar um projeto existente (Flow Intelligence)
```bash
# Flow: Gargalos → Estratégia → Execução
npx tsx scripts/orchestrator.ts --chain=flow --project=profitbridge

# Resultado: approved-actions.json pronto para execução
```

### Exemplo 3: Auditoria completa
```bash
# Audit: Validação técnica → Reflexão → Custos
npx tsx scripts/orchestrator.ts --chain=audit --project=profitbridge

# Resultado: Relatórios de saúde, aprendizado e custos
```

### Exemplo 4: Pipeline completo (inteligência + auditoria)
```bash
# Full: Flow Intelligence + Auditoria tudo junto
npx tsx scripts/orchestrator.ts --chain=full --project=profitbridge

# Resultado: Análise profunda + Execução aprovada + Validação
```

### Exemplo 5: Ciclo completo de desenvolvimento
```bash
# Cycle: Pesquisa → PRD → Ciclo 1 → Pipeline → Ciclo 2
npx tsx scripts/orchestrator.ts --chain=cycle --project=novo-produto

# Resultado: Projeto em Ciclo 2 pronto para próximas ações
```

### Exemplo 6: Deploy em produção
```bash
# Deploy: Build → Deploy → Health Check → Launch
npx tsx scripts/orchestrator.ts --chain=deploy --project=profitbridge

# Resultado: Aplicação em produção e monitorada
```

### Exemplo 7: Execução completa (tudo)
```bash
# All: Pesquisa → Strategy → Audit → Cycles → Deploy
npx tsx scripts/orchestrator.ts --chain=all --project=novo-projeto --verbose

# Use --verbose para ver output completo dos scripts filhos
```

---

## 🔧 Flags do Orchestrator

| Flag | Descrição |
|------|-----------|
| `--chain=<name>` | Seleciona a chain (stage0, flow, audit, full, cycle, deploy, project, all) |
| `--project=<id>` | ID do projeto (default: one-agent-corp) |
| `--dry-run` | Mostra a ordem de execução sem executar |
| `--force` | Continua execução mesmo se um script falhar |
| `--verbose` | Exibe output completo dos scripts filhos (padrão: quiet) |
| `--list` | Lista todos os scripts registrados e suas dependências |

### Exemplos com Flags

```bash
# Ver ordem de execução sem rodar
npx tsx scripts/orchestrator.ts --chain=full --project=test --dry-run

# Forçar continuação mesmo se houver erro
npx tsx scripts/orchestrator.ts --chain=flow --project=test --force

# Ver tudo que está acontecendo
npx tsx scripts/orchestrator.ts --chain=flow --project=test --verbose

# Listar todos os scripts e dependências
npx tsx scripts/orchestrator.ts --list
```

---

## 📊 Grafo de Dependências (Chains)

### Chain: `stage0`
```
stage0-research
    └── market-scout
    └── generate-prd
```

### Chain: `flow`
```
flow-intelligence
    └── strategy-review (Board: Dalio, Goldratt, Porter)
        └── action-executor
```

### Chain: `audit`
```
auto-audit
    └── post-cycle-reflection
        └── cost-tracker
```

### Chain: `full`
```
auto-audit               flow-intelligence
    └── post-cycle          └── strategy-review
        └── cost-tracker        └── action-executor
```

### Chain: `cycle`
```
generate-prd
    └── start-cycle1
        └── pipeline-full-run
            └── complete-cycle1
                └── advance-to-cycle2
```

### Chain: `deploy`
```
deploy-profitbridge
    └── deploy-full-stack
        └── check-deploy
            └── launch-ai-report-generator
```

---

## 📝 Notas Importantes

1. **Relatórios Gerados:** Todos os scripts salvam seus outputs em `workspace/<project-id>/reports/`.
2. **Modo Quiet (Padrão):** Mostra apenas status, erros e artefatos. Use `--verbose` para ver tudo.
3. **Logs Completos:** Em modo quiet, os logs completos são salvos em `reports/run-logs/`.
4. **Git Isolation:** Projetos não-core (que não sejam "one-agent-corp") rodam em branches isoladas `swarm/<project-id>`.
5. **Topological Sort:** O Orchestrator ordena automaticamente scripts respeitando dependências.

---

*Nota: Todos os scripts `.ts` devem ser executados com `npx tsx` para garantir a transpilação em tempo de execução.*
