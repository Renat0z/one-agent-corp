# Architecture — pingboard

## ARCHITECTURE SPECIFICATION
### Project: **Pingboard** v1.0 — Engineering Blueprint
> *Department of Engineering Architecture | One Agent Corp*

---

### Stack Decision

| Layer | Choice | Rationale |
|---|---|---|
| Runtime | Node.js 20 LTS + TypeScript | Type safety on data models; native `fetch()`; LTS stability |
| Framework | Express 4 | Zero-ceremony HTTP layer; no need for Fastify's overhead at this scale |
| Database | SQLite via `better-sqlite3` | Synchronous, zero-infra, file-backed; perfect for single-VPS MVP |
| Scheduler | `node-cron` | No Redis, no BullMQ — each check runs on its own cron tick |
| Alerting | Evolution API (WhatsApp) → Telegram → Email (nodemailer) | Fallback chain as mandated by Strategy Gate |
| Container | Docker + docker-compose | VPS portability, deterministic deploys |
| Proxy | nginx | TLS termination + reverse proxy to port 3000 |

---

### File Structure

```
pingboard/
├── src/
│   ├── server.ts                   — Express app + graceful shutdown
│   ├── routes/
│   │   ├── checks.ts               — CRUD + /run + /stats + /alerts
│   │   └── alerts.ts               — POST /alerts/test (channel validation)
│   ├── services/
│   │   ├── checker.ts              — HTTP health check executor
│   │   ├── alerter.ts              — Alert dispatcher (WA → Telegram → Email)
│   │   └── channels/
│   │       ├── whatsapp.ts         — Evolution API client
│   │       ├── telegram.ts         — Telegram Bot API client
│   │       └── email.ts            — nodemailer SMTP client
│   ├── db/
│   │   ├── schema.ts               — SQLite schema + migrations
│   │   ├── queries.ts              — Typed query functions (checks, results, alerts)
│   │   └── connection.ts           — Singleton DB connection
│   ├── scheduler.ts                — Dynamic cron registry (add/remove jobs live)
│   ├── types.ts                    — Shared TypeScript interfaces
│   └── config.ts                   — Env var loader + validation
├── dashboard/                      — Static HTML/JS (no framework)
│   ├── index.html
│   ├── app.js
│   └── style.css
├── scripts/
│   └── seed.ts                     — Local dev seed data
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
├── .env.example
├── tsconfig.json
└── package.json
```

---

### Module Contracts

#### `src/types.ts`
```typescript
export interface Check {
  id: string;                        // uuid v4
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'HEAD';
  expected_status: number;           // default 200
  interval_seconds: number;          // min 60
  timeout_ms: number;                // default 5000
  status: 'up' | 'down' | 'unknown';
  last_checked_at: string | null;    // ISO timestamp
  last_status_change_at: string | null;
  created_at: string;
  // Alert routing
  alert_whatsapp: string | null;     // E164 or group JID
  alert_telegram: string | null;     // chat_id
  alert_email: string | null;
}

export interface CheckResult {
  id: string;
  check_id: string;
  status: 'up' | 'down';
  http_status: number | null;
  response_time_ms: number;
  checked_at: string;
  error_detail: string | null;
}

export interface Alert {
  id: string;
  check_id: string;
  type: 'down' | 'recovery';
  channel: 'whatsapp' | 'telegram' | 'email';
  status: 'sent' | 'failed';
  message: string;
  response_time_ms: number | null;
  http_status: number | null;
  sent_at: string;
  error_log: string | null;
}
```

---

#### `src/db/schema.ts`
```typescript
import db from './connection';

export function initSchema(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS checks (
      id                    TEXT PRIMARY KEY,
      name                  TEXT NOT NULL,
      url                   TEXT NOT NULL,
      method                TEXT NOT NULL DEFAULT 'GET',
      expected_status       INTEGER NOT NULL DEFAULT 200,
      interval_seconds      INTEGER NOT NULL DEFAULT 300,
      timeout_ms            INTEGER NOT NULL DEFAULT 5000,
      status                TEXT NOT NULL DEFAULT 'unknown',
      last_checked_at       TEXT,
      last_status_change_at TEXT,
      created_at            TEXT NOT NULL,
      alert_whatsapp        TEXT,
      alert_telegram        TEXT,
      alert_email           TEXT
    );

    CREATE TABLE IF NOT EXISTS check_results (
      id               TEXT PRIMARY KEY,
      check_id         TEXT NOT NULL REFERENCES checks(id) ON DELETE CASCADE,
      status           TEXT NOT NULL,
      http_status      INTEGER,
      response_time_ms INTEGER NOT NULL,
      checked_at       TEXT NOT NULL,
      error_detail     TEXT
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id               TEXT PRIMARY KEY,
      check_id         TEXT NOT NULL REFERENCES checks(id) ON DELETE CASCADE,
      type             TEXT NOT NULL,
      channel          TEXT NOT NULL,
      status           TEXT NOT NULL,
      message          TEXT NOT NULL,
      response_time_ms INTEGER,
      http_status      INTEGER,
      sent_at          TEXT NOT NULL,
      error_log        TEXT
    );

    -- Performance indexes
    CREATE INDEX IF NOT EXISTS idx_results_check_id   ON check_results(check_id);
    CREATE INDEX IF NOT EXISTS idx_results_checked_at ON check_results(checked_at);
    CREATE INDEX IF NOT EXISTS idx_alerts_check_id    ON alerts(check_id);
  `);
}
```

---

#### `src/services/checker.ts`
```typescript
import { Check, CheckResult } from '../types';
import { saveResult, updateCheckStatus } from '../db/queries';
import { dispatchAlert } from './alerter';
import { randomUUID } from 'crypto';

export async function runCheck(check: Check): Promise<CheckResult> {
  const start = Date.now();
  let status: 'up' | 'down' = 'down';
  let httpStatus: number | null = null;
  let errorDetail: string | null = null;

  try {
    const res = await fetch(check.url, {
      method: check.method,
      signal: AbortSignal.timeout(check.timeout_ms),
    });
    httpStatus = res.status;
    status = res.status === check.expected_status ? 'up' : 'down';
    if (status === 'down') {
      errorDetail = `Expected ${check.expected_status}, got ${res.status}`;
    }
  } catch (err: any) {
    errorDetail = err.message ?? 'Unknown error';
  }

  const responseTime = Date.now() - start;
  const result: CheckResult = {
    id: randomUUID(),
    check_id: check.id,
    status,
    http_status: httpStatus,
    response_time_ms: responseTime,
    checked_at: new Date().toISOString(),
    error_detail: errorDetail,
  };

  saveResult(result);

  // Status transition → trigger alert
  const previousStatus = check.status;
  updateCheckStatus(check.id, status);

  if (previousStatus !== 'unknown' && previousStatus !== status) {
    await dispatchAlert(check, result, status === 'down' ? 'down' : 'recovery');
  }

  return result;
}
```

---

#### `src/services/alerter.ts` — Fallback Chain
```typescript
import { Check, CheckResult, Alert } from '../types';
import { saveAlert } from '../db/queries';
import { sendWhatsApp } from './channels/whatsapp';
import { sendTelegram } from './channels/telegram';
import { sendEmail } from './channels/email';
import { randomUUID } from 'crypto';

type AlertType = 'down' | 'recovery';

function buildMessage(check: Check, result: CheckResult, type: AlertType): string {
  const emoji = type === 'down' ? '🔴' : '🟢';
  const label = type === 'down' ? 'OFFLINE' : 'RECOVERED';
  return (
    `${emoji} *${check.name}* está ${label}\n` +
    `URL: ${check.url}\n` +
    `Status HTTP: ${result.http_status ?? 'N/A'}\n` +
    `Tempo de resposta: ${result.response_time_ms}ms\n` +
    `Horário: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`
  );
}

export async function dispatchAlert(
  check: Check,
  result: CheckResult,
  type: AlertType
): Promise<void> {
  const message = buildMessage(check, result, type);

  // Channel priority: WhatsApp → Telegram → Email
  const channels: Array<{
    name: Alert['channel'];
    target: string | null;
    fn: (target: string, msg: string) => Promise<void>;
  }> = [
    { name: 'whatsapp', target: check.alert_whatsapp, fn: sendWhatsApp },
    { name: 'telegram', target: check.alert_telegram, fn: sendTelegram },
    { name: 'email',    target: check.alert_email,    fn: sendEmail },
  ];

  for (const ch of channels) {
    if (!ch.target) continue;

    const alertRecord: Alert = {
      id: randomUUID(),
      check_id: check.id,
      type,
      channel: ch.name,
      status: 'sent',
      message,
      response_time_ms: result.response_time_ms,
      http_status: result.http_status,
      sent_at: new Date().toISOString(),
      error_log: null,
    };

    try {
      await ch.fn(ch.target, message);
      saveAlert(alertRecord);
      return; // ← SUCCESS: stop fallback chain
    } catch (err: any) {
      alertRecord.status = 'failed';
      alertRecord.error_log = err.message;
      saveAlert(alertRecord);
      // continue to next channel in chain
    }
  }
}
```

---

#### `src/scheduler.ts` — Dynamic Cron Registry
```typescript
import cron from 'node-cron';
import { getAllChecks } from './db/queries';
import { runCheck } from './services/checker';

const registry = new Map<string, cron.ScheduledTask>();

function intervalToCron(seconds: number): string {
  if (seconds < 60) return '* * * * *'; // floor at 1 minute
  const minutes = Math.round(seconds / 60);
  return `*/${minutes} * * * *`;
}

export function registerCheck(check: { id: string; interval_seconds: number; [k: string]: any }): void {
  unregisterCheck(check.id);
  const expression = intervalToCron(check.interval_seconds);
  const task = cron.schedule(expression, async () => {
    const { getCheckById } = await import('./db/queries');
    const fresh = getCheckById(check.id);
    if (fresh) await runCheck(fresh);
  });
  registry.set(check.id, task);
}

export function unregisterCheck(id: string): void {
  registry.get(id)?.stop();
  registry.delete(id);
}

export function bootScheduler(): void {
  const checks = getAllChecks();
  checks.forEach(registerCheck);
  console.log(`[scheduler] ${checks.length} checks registered`);
}
```

---

#### `src/server.ts`
```typescript
import express from 'express';
import path from 'path';
import { initSchema } from './db/schema';
import { bootScheduler } from './scheduler';
import checksRouter from './routes/checks';
import alertsRouter from './routes/alerts';
import { config } from './config';

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dashboard')));

app.use('/api/checks', checksRouter);
app.use('/api/alerts', alertsRouter);

app.get('/health', (_, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

initSchema();
bootScheduler();

const server = app.listen(config.PORT, () => {
  console.log(`[pingboard] listening on port ${config.PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => { server.close(() => process.exit(0)); });
process.on('SIGINT',  () => { server.close(() => process.exit(0)); });

export default app;
```

---

### Environment Variables

```bash
# .env.example
PORT=3000
DB_PATH=/data/checks.db
CHECK_TIMEOUT_MS=5000

# WhatsApp — Evolution API
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=your-api-key
EVOLUTION_INSTANCE=pingboard

# Telegram (fallback)
TELEGRAM_BOT_TOKEN=
TELEGRAM_DEFAULT_CHAT_ID=

# Email (fallback)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=alerts@pingboard.io

# Dashboard basic auth (nginx level)
DASHBOARD_USER=admin
DASHBOARD_PASS=changeme
```

---

### `Dockerfile`

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci
COPY src ./src
RUN npm run build

FROM node:20-alpine AS runner
RUN apk add --no-cache dumb-init
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY dashboard ./dashboard
VOLUME ["/data"]
EXPOSE 3000
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
```

---

### `docker-compose.yml`

```yaml
version: '3.9'

services:
  pingboard:
    build: .
    container_name: pingboard_app
    restart: unless-stopped
    environment:
      PORT: 3000
      DB_PATH: /data/checks.db
      CHECK_TIMEOUT_MS: ${CHECK_TIMEOUT_MS:-5000}
      EVOLUTION_API_URL: ${EVOLUTION_API_URL}
      EVOLUTION_API_KEY: ${EVOLUTION_API_KEY}
      EVOLUTION_INSTANCE: ${EVOLUTION_INSTANCE}
      TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN}
      SMTP_HOST: ${SMTP_HOST}
      SMTP_PORT: ${SMTP_PORT}
      SMTP_USER: ${SMTP_USER}
      SMTP_PASS: ${SMTP_PASS}
      SMTP_FROM: ${SMTP_FROM}
    volumes:
      - pingboard_data:/data
    networks:
      - internal
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/health"]
      interval: 30s
      timeout: 5s
      retries: 3

  nginx:
    image: nginx:alpine
    container_name: pingboard_nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - nginx_certs:/etc/letsencrypt:ro
    depends_on:
      - pingboard
    networks:
      - internal

volumes:
  pingboard_data:
  nginx_certs:

networks:
  internal:
    driver: bridge
```

---

### `nginx.conf`

```nginx
events { worker_connections 1024; }

http {
  upstream app {
    server pingboard:3000;
  }

  server {
    listen 80;
    server_name _;

    # Dashboard — basic auth
    location / {
      auth_basic "Pingboard";
      auth_basic_user_file /etc/nginx/.htpasswd;
      proxy_pass http://app;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
    }

    # API — no basic auth (API key at app level, post-MVP)
    location /api/ {
      proxy_pass http://app;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
    }

    # Internal health — no auth
    location /health {
      proxy_pass http://app;
      access_log off;
    }
  }
}
```

---

### `package.json`

```json
{
  "name": "pingboard",
  "version": "1.0.0",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc --outDir dist",
    "start": "node dist/server.js",
    "seed": "tsx scripts/seed.ts"
  },
  "dependencies": {
    "better-sqlite3": "^9.4.3",
    "express": "^4.18.3",
    "node-cron": "^3.0.3",
    "nodemailer": "^6.9.13",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.8",
    "@types/express": "^4.17.21",
    "@types/node": "^20.11.30",
    "@types/nodemailer": "^6.4.14",
    "@types/uuid": "^9.0.8",
    "tsx": "^4.7.1",
    "typescript": "^5.4.2"
  }
}
```

---

### Architecture Decision Log (ADL)

| Decision | Chosen | Rejected | Reason |
|---|---|---|---|
| Scheduler | `node-cron` | BullMQ + Redis | No external infra; single VPS; Redis is overkill until multi-node |
| DB | SQLite | PostgreSQL | Zero setup; file-based backups (`cp`); handles 10k checks easily |
| HTTP Client | Native `fetch()` | axios | Node 20 native; zero deps; `AbortSignal.timeout()` built-in |
| Alert Dispatch | Sequential fallback | Parallel fanout | One confirmed delivery is enough; parallel wastes Evolution API quota |
| Auth | nginx basic auth | JWT / session | Auth is out of MVP scope per PRD; nginx layer is good enough for beta |
| Dashboard | Vanilla HTML/JS | React/Next.js | Zero build tooling; loads instantly; no hydration complexity |

---

### Deploy Runbook (VPS: `89.167.83.218`)

```bash
# 1. SSH in
ssh root@89.167.83.218

# 2. Clone + configure
git clone <repo> /opt/pingboard && cd /opt/pingboard
cp .env.example .env && nano .env

# 3. Generate nginx basic auth
apt install apache2-utils -y
htpasswd -c nginx/.htpasswd admin

# 4. Boot
docker compose up -d --build

# 5. Verify
curl http://89.167.83.218/health
# → {"status":"ok","ts":"..."}
```

---

> **Fowler note:** This architecture has one seam that matters — `alerter.ts` dispatches to three pluggable channel modules. Adding a fourth channel (Slack, PagerDuty) means adding one file under `channels/` and one entry in the array. Nothing else changes. That is the correct level of extensibility for an MVP: open for addition, closed for modification, with zero over-abstraction.