# PRD — whatsapp-crm-swarm

## PRODUCT REQUIREMENTS DOCUMENT

### North Star Metric
**Lead Conversion Velocity:** O tempo médio reduzido entre a chegada do lead no WhatsApp e a primeira interação qualificada/movimentação no Kanban.

### MVP Scope (MUST-HAVE only)
| Feature | Why critical | Effort (S/M/L) |
|---|---|---|
| **Evolution API Sync** | Sem conexão estável com o WhatsApp, não há produto. É a base da confiança do usuário. | M |
| **Visual Kanban Board** | Resolve a dor da fragmentação. Permite ao gestor ver o dinheiro "parado" no funil. | M |
| **Auto-Response Swarm** | Valida a hipótese de automação imediata para evitar a perda de 40% dos leads. | L |
| **Lead Capture Hook** | Transforma notificações do Meta Ads/Webhooks em cards automáticos no CRM. | S |
| **Simple Analytics** | Mostra ao dono da PME quantos leads foram ganhos/perdidos por etapa. | S |

### User Stories (top 3)
1. Como **Dono de PME**, quero que cada novo lead do Facebook/Instagram crie automaticamente um card no meu Kanban, para que nenhum contato seja esquecido.
2. Como **Vendedor**, quero que o sistema envie uma mensagem de boas-vindas instantânea via WhatsApp, para manter o lead quente enquanto eu não posso atender.
3. Como **Gestor**, quero arrastar um card de "Lead" para "Agendado" e disparar uma automação de confirmação, para reduzir o trabalho manual repetitivo.

### API Endpoints (REST)
```
POST   /api/instances      — Conectar nova instância Evolution API (QR Code)
GET    /api/kanban/cards   — Listar todos os leads no funil por coluna
PATCH  /api/kanban/cards/:id — Mover lead entre etapas (dispara automação)
POST   /api/swarms/rules   — Criar regra de resposta automática (Trigger -> Action)
GET    /api/analytics/mrr  — Visualizar conversão e valor de leads no funil
```

### Data Model
```typescript
Lead {
  id, whatsapp_id, name, current_stage_id,
  source: "meta_ads" | "manual" | "organic",
  status: "active" | "won" | "lost",
  last_interaction_at, created_at
}
Stage {
  id, name, order, color,
  automation_id: string // Link para o Swarm de automação
}
SwarmAction {
  id, stage_id, trigger: "on_enter" | "on_delay",
  action_type: "send_text" | "send_media" | "notify_admin",
  content: string
}
```

### Success Criteria (MVP done when):
1. **Conectividade:** Uma instância da Evolution API conectada e recebendo mensagens em < 2 segundos.
2. **Fluxo Completo:** Um lead vindo de um webhook externo gera um card e recebe uma mensagem automática sem intervenção humana.
3. **Usabilidade:** O gestor consegue mover o card no Kanban e a alteração persiste no banco de dados e reflete no dashboard em tempo real.