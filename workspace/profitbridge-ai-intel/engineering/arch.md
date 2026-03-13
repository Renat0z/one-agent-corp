# Architecture — profitbridge-ai-intel

Architectural blueprint for **profitbridge-ai-intel** (MVP) has been generated.

### Execution Summary
- **Stack**: Node.js 20, Express, SQLite (better-sqlite3), node-cron.
- **Service Layer**: Health checker with native `fetch` (Node 18+), status-based alerting via webhooks.
- **Persistence**: File-based SQLite with WAL mode for high-concurrency safety.
- **Infrastructure**: Dockerized environment with Nginx reverse proxy.

### File Manifest
- `profitbridge-ai-intel/src/server.ts`: API entry point and cron scheduler.
- `profitbridge-ai-intel/src/db/schema.ts`: SQLite schema initialization (Audit Logs + Checks).
- `profitbridge-ai-intel/src/db/queries.ts`: Typed data access layer.
- `profitbridge-ai-intel/src/services/checker.ts`: Core logic for health pings and alerts.
- `profitbridge-ai-intel/Dockerfile`: Multi-stage ready build.
- `profitbridge-ai-intel/docker-compose.yml`: Full stack orchestration.
- `profitbridge-ai-intel/nginx.conf`: Production-ready proxy configuration.

### Security Implementation
- **Data Isolation**: Volume mapping for `/data` directory.
- **Privacy**: `.gitignore` strictly blocks environment and local data leakage.
- **Resilience**: Container restart policies and timeout-managed HTTP probes.

### Deployment Instructions
1. Upload folder to `/opt/profitbridge-ai-intel` on `89.167.83.218`.
2. Run `docker-compose up -d`.
3. API available at `http://89.167.83.218/api/checks`.