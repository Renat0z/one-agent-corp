# Dashboard de Gestão - One Agent Corp

Este dashboard permite monitorar a saúde dos projetos, acompanhar o funil de vendas e automatizar ações corretivas via scripts.

## 📊 Projetos Ativos

| Projeto | MRR Atual | Meta | Saúde | Ação Recomendada |
| :--- | :--- | :--- | :--- | :--- |
| **ProfitBridge AI** | $29,550 | $50,000 | 85% | `flow-intelligence` |

## 🛠 Comandos de Gestão

### 1. Sincronizar e Monitorar
Para ler todos os arquivos `.md` e disparar scripts de correção baseados nos KPIs:
```bash
npx tsx scripts/dashboard-monitor.ts
```

### 2. Adicionar/Editar Projeto
Para atualizar os dados de um projeto (ex: atualizar número de clientes ou visitantes), edite o arquivo correspondente:
`workspace/{id}/dashboard-data.md`

### 3. Scripts de Auditoria Profunda
Se o score de saúde cair abaixo de 50%, rode:
```bash
npx tsx scripts/orchestrator.ts --chain=audit --project={id}
```

---

## 📈 Metas Globais (Q1 2026)
- **MRR Total:** $150k
- **Projetos em Escala:** 3
- **Conversão Média:** 2.5%
