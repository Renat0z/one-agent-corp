# Architecture — profitbridge-ai

# ARCHITECTURE SPECIFICATION: ProfitBridge-AI
**Department of Engineering Architecture**
**Status:** FINAL DEPLOYABLE SPEC
**Mindset:** Martin Fowler (Minimalism + Clear Separation of Concerns)

## 1. System Design Overview
A lightweight, event-driven monitoring service that synchronizes payment data with platform access via periodic CRON jobs, persisting state in a local SQLite instance for zero-latency auditing.

## 2. File Structure & Manifest
```text
profitbridge-ai/
├── src/
│   ├── server.ts          # Express entry point & API Middleware
│   ├── routes/
│   │   ├── audit.ts       # Manual trigger & Dashboard data
│   │   └── webhooks.ts    # Hotmart/Kajabi incoming events
│   ├── services/
│   │   ├── sync-engine.ts # Cross-reference Logic (Payment vs Access)
│   │   ├── fingerprint.ts # IP/Geo Behavior analysis
│   │   └── platform-api.ts# Hotmart/Kajabi Client Wrappers
│   ├── db/
│   │   ├── schema.ts      # Better-sqlite3 Table Definitions
│   │   └── repository.ts  # ACID compliant DB operations
│   └── scheduler.ts       # Node-cron definition (Default: 1h sync)
├── Dockerfile             # Multi-stage Node 20 Build
├── docker-compose.yml     # Persistent Volume & Nginx link
├── nginx.conf             # Reverse Proxy & Rate Limiting
└── package.json           # Native fetch (Node 20) + Typescript
```

## 3. Data Schema (SQLite)
```sql
CREATE TABLE "users" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT UNIQUE,
  "hotmart_status" TEXT, -- active, refunded, canceled
  "platform_access" BOOLEAN,
  "last_sync" DATETIME,
  "risk_score" INTEGER DEFAULT 0
);

CREATE TABLE "access_logs" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "user_id" TEXT,
  "ip_address" TEXT,
  "geo_location" TEXT,
  "timestamp" DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 4. Key Technical Decisions
1.  **Identity Reconciliation**: Uses Email as the primary key across Hotmart and the LMS to identify "Ghost" users (Access = True AND Payment = Canceled).
2.  **Fingerprinting**: Implements a sliding window algorithm (last 24h) to count unique `/24` IP ranges per user. 
3.  **Kill-Switch Implementation**: Non-destructive by default. The `Automated Access Kill-Switch` calls the LMS `DELETE /member` or `PATCH /access` only after a "Confirmed Leak" flag is set.
4.  **Security**: 
    - `crypto.timingSafeEqual` for webhook signature verification.
    - All API keys stored in `.env` (blocked by `.gitignore`).
    - SQLite WAL (Write-Ahead Logging) mode enabled for concurrent read/write during sync.

## 5. Deployment Specs (Target: 89.167.83.218)
- **Containerization**: Single process container.
- **Persistence**: `/data/checks.db` mounted as a Docker Volume to survive restarts.
- **Nginx Config**:
  ```nginx
  location / {
      proxy_pass http://localhost:3000;
      limit_req zone=one burst=5;
  }
  ```

## 6. Infrastructure as Code (Minimal)
**Dockerfile:**
```dockerfile
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
RUN npm run build
CMD ["node", "dist/server.js"]
```

**Environment Variables:**
```bash
PORT=3000
DB_PATH=/data/profitbridge.db
HOTMART_CLIENT_ID=...
HOTMART_CLIENT_SECRET=...
KAJABI_API_KEY=...
ALERT_WEBHOOK_URL=...
SYNC_INTERVAL="0 * * * *" # Hourly
```