# Architecture — whatsapp-crm-swarm

## ARCHITECTURE SPECIFICATION

### Security Blueprint (MANDATORY)
1.  **Auth**: API Key baseada em `crypto.randomBytes(32).toString('hex')` para comunicação entre Evolution API e CRM.
2.  **Storage**: Webhook Secrets e API Keys da Evolution API armazenados com criptografia simétrica (AES-256-GBC) em repouso no SQLite.
3.  **Validation**: `express-validator` para todos os payloads de entrada; Rate-limit de 100 req/min para webhooks de entrada.
4.  **Hygiene**: `.gitignore` configurado para ignorar `.env`, `*.db`, `node_modules/`, e logs de depuração da Evolution.

### Stack Decision
- **Runtime**: Node.js 20 (LTS)
- **Framework**: Express 4 + TypeScript
- **Database**: SQLite (`better-sqlite3`) para persistência de baixo custo e alta velocidade.
- **Real-time**: Socket.io para atualização instantânea do Kanban Board.
- **Integration**: `axios` para orquestração da Evolution API (v2).
- **Frontend**: Next.js 14 (App Router) em container separado.

### File Structure
```
whatsapp-crm-swarm/
├── src/
│   ├── server.ts           — Entry point (Express + Socket.io)
│   ├── routes/
│   │   ├── evolution.ts    — Webhooks da Evolution API
│   │   ├── kanban.ts       — CRUD de Leads e Estágios
│   │   └── auth.ts         — Gestão de API Keys
│   ├── services/
│   │   ├── evolution.ts    — Wrapper para comandos da Evolution API
│   │   ├── swarm-engine.ts — Executor de regras de automação
│   │   └── socket.ts       — Gerenciador de eventos real-time
│   ├── db/
│   │   ├── schema.sql      — Inicialização de tabelas (Leads, Stages, Swarms)
│   │   └── database.ts     — Singleton do better-sqlite3
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
└── package.json
```

### Key Technical Decisions
1. **Webhook-First**: O sistema é reativo aos webhooks da Evolution API para garantir o North Star (Lead Velocity).
2. **State Machine Simples**: A transição de estágios no Kanban dispara o `swarm-engine`, que executa promessas de automação de forma assíncrona.
3. **SQLite WAL Mode**: Habilitado para suportar múltiplas leituras e escritas concorrentes sem travar a interface do usuário.
4. **Portabilidade**: Imagem Docker única contendo Backend e Workers para rodar em qualquer VPS de 1GB RAM.

### Environment Variables
```bash
PORT=3000
DB_PATH=/data/crm.db
EVOLUTION_API_URL=https://sua-instancia.com
EVOLUTION_API_KEY=apikey_aqui
WEBHOOK_SECRET=token_de_validacao_webhook
NODE_ENV=production
```

### Deploy Target
- **VPS**: 89.167.83.218 (Ubuntu 22.04 LTS)
- **Port**: CRM Dashboard em :3000, API em :3001
- **Proxy**: Nginx roteando `crm.dominio.com` -> :3000 e `api-crm.dominio.com` -> :3001
- **Directory**: `/opt/one-agent/whatsapp-crm-swarm`