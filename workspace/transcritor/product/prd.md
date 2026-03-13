# PRD — Transcritor WhatsApp — Finalização

## Visão do Produto (Eric Ries)
O MVP já transcreve áudio. O objetivo agora é fechar o ciclo de venda e retenção (SaaS Core).

## Requisitos Funcionais (User Stories)
1. **Cobrança Ativa (Billing):** Como usuário, quero assinar o serviço e ter meu limite aumentado de 5 áudios (trial) para 300 minutos (paid).
2. **Histórico (Dashboard):** Como usuário, quero ver minhas transcrições passadas no dashboard web.
3. **Notificação (Churn Prevention):** Como usuário trial, quero receber uma mensagem de WhatsApp quando meu período de teste estiver acabando.

## Acceptance Criteria (Marty Cagan)
- O webhook do Mercado Pago deve processar notificações `payment.created` e `subscription.created`.
- A API do dashboard deve retornar dados paginados das transcrições.
- As mensagens de áudio falhas devem ser logadas com o `messageId` para suporte.

---
*Assinado: Department of Product*