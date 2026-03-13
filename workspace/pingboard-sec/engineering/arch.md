# Architecture — pingboard-sec

## ARCHITECTURE SPECIFICATION

### Security Blueprint (MANDATORY)
1.  **Auth**: Use Node.js `crypto.randomBytes(32).toString('hex')` for API Keys.
2.  **Storage**: API Keys and sensitive credentials MUST be hashed using `SHA-256` (via `crypto.createHash`) before storage in SQLite.
3.  **Validation**: Rate-limiting (max 10 requests per minute for the `run` endpoint) to prevent infrastructure abuse.
4.  **Hygiene**: `.gitignore` configured to block `.env`, `node_modules`, `*.db`, `*.db-journal`, and the `data/` volume.

### Stack Decision
- **Runtime**: Node.js 20.x (LTS)
- **Framework**: Express 4.x (TypeScript)
- **Database**: SQLite 3 via `better-sqlite3` (synchronous performance for low-concurrency writes)
- **Queue/Scheduler**: `node-cron` for in-memory scheduling of check intervals
- **Container**: Docker + Multi-stage Build (Alpine base)
- **Reverse Proxy**: Nginx (handling SSL termination and static caching)

### File Structure
```text
pingboard-sec/
├── src/
│   ├── server.ts          — App bootstrap, DB init, and error handling
│   ├── routes/
│   │   └── checks.ts      — Endpoints for CRUD + manual execution trigger
│   ├── services/
│   │   ├── checker.ts     — Logic for native fetch() calls and status detection
│   │   └── alerter.ts     — Integration with Evolution API (WhatsApp)
│   ├── db/
│   │   ├── schema.ts      — SQLite table definitions (Checks, Alerts, Logs)
│   │   └── queries.ts     — Pre-compiled SQL statements for performance
│   ├── middleware/
│   │   └── auth.ts        — Header-based API Key verification
│   └── scheduler.ts       — Logic to sync DB state with cron jobs on startup
├── Dockerfile             — Multi-stage build for minimal image size
├── docker-compose.yml     — Orchestration for App + Nginx + Volume mapping
├── nginx.conf             — Proxy pass configuration to Node:3000
└── package.json           — Minimal dependencies (express, better-sqlite3, node-cron, zod)
```

### Key Technical Decisions
1.  **SQLite Persistence**: Chosen for zero-ops maintenance. The DB file will reside in a Docker Volume (`/data`) to persist across deployments.
2.  **In-Memory Cron**: Instead of Redis/BullMQ, `node-cron` is used to keep the stack single-process. The `scheduler.ts` will reload all active checks into memory on application start.
3.  **Native Fetch (Node 20)**: Removes `axios` or `node-fetch` dependency, reducing the attack surface and bundle size.
4.  **Stateful Monitoring**: The `checker` service will compare the current status with the last known DB status to prevent "Alert Fatigue" (only notifying on state *transitions*).

### Environment Variables
```bash
PORT=3000
NODE_ENV=production
DB_PATH=/data/pingboard.db
EVOLUTION_API_URL=https://your-evo-instance.com
EVOLUTION_API_KEY=your-secret-key
EVOLUTION_INSTANCE_ID=pingboard-alerts
CHECK_TIMEOUT_MS=10000
MASTER_API_KEY=  # For initial admin setup
```

### Deploy Target
- **VPS IP**: 89.167.83.218
- **Port**: 3000 (Internal) / 80/443 (External via Nginx)
- **CI/CD Strategy**: GitHub Actions -> SSH -> `docker-compose up -d --build`
- **Directory**: `/opt/pingboard-sec` (Root-owned, App-run via non-privileged user in Docker)