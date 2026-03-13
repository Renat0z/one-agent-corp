# PRD (Product Requirements Document) — WhatsApp CRM Swarm

## Objetivo do Produto (Marty Cagan · Eric Ries)

### O Problema (The Pain)
PMEs e freelancers perdem leads no WhatsApp por falta de acompanhamento imediato (speed-to-lead) e esquecimento de follow-ups manuais.

### A Proposta de Valor (The Gain)
Transformar conversas dispersas em funis de vendas estruturados com automação inteligente, garantindo que nenhum lead esfrie.

### Métricas de Sucesso (Métricas Piratas AARRR)
- **Aquisição:** Número de instâncias conectadas.
- **Ativação:** Primeiro funil automatizado configurado.
- **Retenção:** Taxa de churn mensal de instâncias conectadas.
- **Receita:** MRR (Monthly Recurring Revenue) via assinaturas.

## Funcionalidades Core (MVP)

### 1. Gestão de Instâncias (Multi-tenant)
- Conexão de instâncias via QR Code (Evolution API).
- Status de conexão em tempo real.
- Isolamento de dados por usuário.

### 2. Funis de Vendas Automatizados
- Triggers: "Nova conversa", "Palavra-chave específica", "Tag adicionada".
- Ações: "Enviar mensagem", "Esperar tempo X", "Adicionar Tag", "Notificar Admin".

### 3. CRM Kanban (Leads)
- Visualização de leads em colunas (Novo, Qualificado, Proposta, Fechado, Perdido).
- Histórico completo da conversa integrado ao card.

## User Stories

### US-1: Conexão Simples
**Como** dono de negócio, **quero** escanear um QR code e conectar meu WhatsApp **para que** eu possa começar a automatizar minhas vendas rapidamente.

### US-2: Funil de Resposta Imediata
**Como** vendedor, **quero** que o sistema envie uma mensagem de boas-vindas automática **para que** o lead não espere e eu tenha tempo de atender pessoalmente.

### US-3: Gestão de Leads
**Como** gestor de vendas, **quero** mover leads entre colunas de um Kanban **para que** eu tenha visibilidade total do meu pipeline.

