# Execution Plan — Transcritor WhatsApp

## Diagnóstico Estratégico (Eliyahu Goldratt)
O **Gargalo de Goldratt** atual é a **Monetização/Billing**. O sistema transcreve, mas não tem como cobrar. Sem cobrança, o SaaS não escala. O segundo gargalo é a **Retenção (Dashboard)**.

## Roadmap de Execução (Ray Dalio)
1. **Fase 1 (Conversão):** Implementar o Webhook do Mercado Pago para atualizar o `plan_status`.
2. **Fase 2 (UX/Dashboard):** Criar a API de busca de transcrições (`/api/transcriptions`) para o Dashboard.
3. **Fase 3 (Retenção):** Configurar notificações via WhatsApp no D-5 e D-7 do Trial.
4. **Fase 4 (Resiliência):** Implementar retentativa (Retry) no download do áudio da Evolution API.

## KPI de Sucesso (Michael Porter)
- **TTV (Time to Value):** Transcrição entregue em menos de 10 segundos.
- **Conversion Rate:** Trial -> Paid via Webhook sem erro humano.

---
*Assinado: Department of Strategy*