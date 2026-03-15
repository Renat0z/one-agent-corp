# Daily Funnel Targets — whatsapp-crm-swarm
# Identity: CLAUDIO-HARD MRR MONITOR

## 📉 DAILY FUNNEL TARGETS (Baseline para $165 MRR/mês)

Para atingir a meta de 3 clientes pagantes/mês com um ticket médio de ~$55, precisamos sustentar o seguinte fluxo diário:

| Etapa do Funil | Meta Diária | Descrição |
| :--- | :--- | :--- |
| **Top (Reach)** | 100-150 | Impressões/Alcance no Instagram (Direct/Content) |
| **Middle (Leads)** | 13-15 | Leads que iniciaram conversa ou clicaram no link |
| **Deep (Demo/Trial)** | 1-2 | Instalações/Testes da Evolution API + CRM |
| **Bottom (Conversion)** | 0.1 | 1 fechamento a cada 10 dias (3/mês) |

---

## 🚦 TAXAS MÍNIMAS DE CONVERSÃO (GUARDRAILS)

Se os números caírem abaixo disto, o `orchestrator.ts --chain=flow` deve ser acionado:

- **Taxa de Atração (CTR/Reach to Lead):** Mínimo **10%**. 
  - *Abaixo disso:* Oferta/Hook fraco.
- **Taxa de Engajamento (Lead to Trial):** Mínimo **8%**.
  - *Abaixo disso:* Fricção no setup ou falta de urgência.
- **Taxa de Fechamento (Trial to MRR):** Mínimo **5-10%**.
  - *Abaixo disso:* Valor percebido baixo ou complexidade técnica.

---

## 🛠️ DASHBOARD DE MONITORAMENTO DIÁRIO

Execute este comando para atualizar os dados reais (Simulação via script de auditoria):
`npx tsx scripts/orchestrator.ts --chain=audit --project=whatsapp-crm-swarm`

### Registro de Desvio (Anti-Fragilidade)
- **Desvio > 20% negativo:** Rodar `market-scout-benchmarking.ts` para ajustar precificação/oferta.
- **Desvio > 20% positivo:** Rodar `action-executor.ts --action=scale-ads` para acelerar o MRR.

---
**One Agent Corp v10.0 | Daily MRR Intensity**
