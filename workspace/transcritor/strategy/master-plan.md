# Master Plan de Execução Total — Transcritor WhatsApp

## Fase 1: Core Engineering (Multi-Instance & Persistence)
1. **Refatoração Global:** Aplicar o padrão de Global API Key em todos os serviços de sessão.
2. **Persistência SQL:** Garantir que `sessions` e `users` estão vinculados por `instance_name` único.
3. **Webhook Router:** Implementar triagem de `instanceId` para roteamento de áudio multi-usuário.

## Fase 2: Fintech & Security (Mercado Pago)
1. **Webhook Seguro:** Implementar verificação de `x-signature` (HMAC-SHA256).
2. **Trial-to-Paid Flow:** Automatizar a transição de `plan_status` e registro de eventos de pagamento.
3. **Billing Jobs:** Ativar o `notificationJob` para avisos de expiração via WhatsApp.

## Fase 3: UX/UI Intelligence (Design & Frontend)
1. **QR Code Engine:** Implementar no `app.js` o timer de 30s com refresh automático sem recriação de instância.
2. **Dashboard Data:** Criar API de consumo de histórico de transcrições com paginação.
3. **Landing Page:** Vincular botões de checkout ao fluxo do Mercado Pago.

## Fase 4: DevOps & QA (Launch Readiness)
1. **Auto-Audit:** Executar validação de variáveis de ambiente e integridade de banco.
2. **Docker Orchestration:** Configurar `docker-compose.prod.yml` com Nginx e SSL (Certbot).
3. **Stress Test:** Simular múltiplos webhooks simultâneos para validar o roteamento por instância.

---
*Assinado: Department of Strategy & Admin*