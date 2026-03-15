# 🧠 One Agent Corp - Estrutura de Squads & Departamentos v11.0

A organização abaixo é inspirada no `aiox-core`, adaptando o conceito de "High-Density" para o ecossistema One Agent Corp.

## 📂 Arquitetura de Pasta do Squad (Template)
Cada Squad (ex: `squad-growth-hacking`, `squad-technical-mastery`) deve seguir esta estrutura para garantir interoperabilidade:

```text
squad-{name}/
├── agents/       # Definições de Personalidade (System Prompts)
├── checklists/   # Gates de Qualidade (Definition of Done)
├── data/         # Contexto específico, bases de leads, resultados de scrapers
├── scripts/      # O braço executor (TS/Bash/Python)
├── tasks/        # Unidades atômicas de trabalho (JSON/YAML)
├── templates/    # Blueprints para PRDs, Copy, Código
└── workflows/    # Grafos de execução (Chains)
```

## 🏗️ Mapeamento de Departamentos vs Squads

### 1. Departamento de Market Intelligence
*   **Squad: Niche Discovery**
    *   *Agents:* Scout, Analyst.
    *   *Tasks:* Scrape trends, Analyze competition.
    *   *Workflows:* `market-validation-flow`.

### 2. Departamento de Product Engineering
*   **Squad: Claude Code Mastery (O-1 Emulated)**
    *   *Agents:* Architect, Senior Dev, QA Auditor.
    *   *Checklists:* Security-first, Code-Density, Modular-Interactions.
    *   *Scripts:* `auto-refactor.ts`, `deploy-vps.ts`.

### 3. Departamento de Growth & Profit
*   **Squad: Funnel Optimization**
    *   *Agents:* Copywriter, Media Buyer AI.
    *   *Workflows:* `lead-to-mrr-conversion`.

## 🔄 Fluxo de Trabalho (Workflows Estilo AIOX)

Diferente dos scripts lineares, os novos Workflows em `squads/` utilizam o **Orchestrator V11** para:

1.  **Checklist Entry Gate:** O Squad só inicia se o `context.json` tiver os inputs necessários.
2.  **Task Atomic Execution:** Cada tarefa é uma promessa no bus de eventos.
3.  **Template Filling:** O resultado da Task preenche um template (ex: `prd-template.md`).
4.  **Audit Gate:** O squad de QA valida o output antes de marcar como `completed`.

---
*Documentação gerada por CLAUDIO-HARD (Identity: High-density Analysis & Routing Device)*
