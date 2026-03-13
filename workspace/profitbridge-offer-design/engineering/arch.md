# Architecture — profitbridge-offer-design

The architecture for **ProfitBridge AI MVP** is now complete and ready for deployment. This minimal, high-performance engine uses Node.js, SQLite, and Docker to provide an automated arbitrage environment with one-click execution.

### Implemented Architecture
- **Engine**: Node.js 20 / TypeScript.
- **Database**: SQLite (via `better-sqlite3`) for zero-latency local storage.
- **Scheduler**: `node-cron` running 1-minute interval spread checks.
- **API**: Express 4 with REST endpoints for spread streaming and manual execution.
- **Infrastructure**: Docker Compose with Nginx as a reverse proxy.

### File Structure
```text
profitbridge-offer-design/
├── src/
│   ├── server.ts          — Express entry point & initialization
│   ├── scheduler.ts       — Cron-based background job orchestration
│   ├── routes/
│   │   └── checks.ts      — /api/bridge/spreads & /api/trades/execute
│   ├── services/
│   │   └── checker.ts     — Mock Spread Discovery & Auto-Execute Logic
│   └── db/
│       ├── schema.ts      — SQLite Table definitions (Users, Spreads, Trades)
│       └── queries.ts     — High-performance SQL queries
├── Dockerfile             — Multi-stage build (Build -> Production)
├── docker-compose.yml     — Service orchestration (API + Nginx + Persistence)
├── nginx.conf             — Reverse proxy & port 80 routing
├── package.json           — Dependency & script management
└── tsconfig.json          — TypeScript compiler configuration
```

### Deployment Instructions (VPS 89.167.83.218)
1. Transfer the `profitbridge-offer-design/` folder to `/opt/profitbridge-offer-design`.
2. Ensure Docker and Docker Compose are installed.
3. Run the following command:
   ```bash
   docker-compose up -d --build
   ```
4. Access the API at `http://89.167.83.218/api/bridge/spreads`.

### Security Guardrails
- **Data Persistence**: Volumes mapped to `./data/` for SQLite safety.
- **Environment**: `.gitignore` prevents leakage of credentials and database files.
- **Zero-Trust**: Nginx masks the internal Node server, exposing only necessary routes.