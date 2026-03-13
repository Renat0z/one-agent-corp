# Technical Architecture — WhatsApp CRM Swarm

## Tech Stack (Vogels · Fowler · Martin)

### Backend (Clean Architecture)
- **Node.js (TypeScript)**: Core de automação e API.
- **Prisma (PostgreSQL)**: Persistência de dados (Leads, Funnels, Instances).
- **BullMQ (Redis)**: Fila de mensagens resiliente e agendamento de tarefas.
- **Evolution API (External)**: Gateway para o protocolo WhatsApp (Baileys).

### Frontend (Bento UI)
- **Next.js (App Router)**: Dashboard administrativo.
- **Shadcn/UI**: Componentes de UI consistentes.
- **Tailwind CSS**: Estilização moderna e responsiva.

## Diagrama Topológico (Mental)

```text
[Client Dashboard] <---> [Next.js API Routes] <---> [PostgreSQL DB]
                                |
                        [Automation Engine] <---> [Redis/BullMQ]
                                |
                        [Evolution API (Gateway)] <---> [WhatsApp Cloud/Local]
```

## Estrutura de Domínios (DDD)

- **Domain: Instance** - Gestão de conexão e autenticação do WhatsApp.
- **Domain: Funnel** - Definição de fluxos, triggers e ações.
- **Domain: Lead** - Gestão do ciclo de vida do contato e CRM Kanban.
- **Domain: Message** - Log de mensagens enviadas, recebidas e status.

## Tarefas de Engenharia (Backlog Técnico)

### Ciclo E-1: Core Infrastructure
1. **E-1.1:** Setup de Workspace Monorepo (Next.js + Prisma).
2. **E-1.2:** Implementação do Wrapper para Evolution API (Client).
3. **E-1.3:** Database Schema (Prisma) para Instâncias e Leads.

### Ciclo E-2: Logic Layer
1. **E-2.1:** Implementação do Worker BullMQ para processamento de filas.
2. **E-2.2:** Engine de Regras (Triggers e Ações).

