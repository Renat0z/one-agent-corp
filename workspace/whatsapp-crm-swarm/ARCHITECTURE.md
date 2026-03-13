# ARCHITECTURE SPECIFICATION — whatsapp-crm-swarm
**Status**: APPROVED (Minimalist Fowler Pattern)
**Owner**: Department of Engineering Architecture

## 1. System Topology
A single-process Node.js 20 application with internal scheduling and zero-external-dependency persistence.

## 2. Security Blueprint (Hardened)
- **Token Generation**: `crypto.randomBytes(32).toString('hex')` for session/API tokens.
- **Data Protection**: 
    - Argon2 or SHA-256 for user secrets.
    - Database encryption at rest (optional, filesystem level).
- **Traffic Safety**:
    - Rate-limiting: `express-rate-limit` (5 failures / 10 min window).
    - Validation: `zod` schema enforcement for all `POST/PUT` payloads.
- **Hygiene**: `.gitignore` strictly enforced for `.env`, `*.db`, `node_modules/`, and `dist/`.

## 3. Technology Stack
| Component | Choice | Justification |
| :--- | :--- | :--- |
| **Runtime** | Node.js 20 (LTS) | Native `fetch`, stable ESM support. |
| **API Framework** | Express 4 | Industry standard, massive middleware ecosystem. |
| **Database** | SQLite (`better-sqlite3`) | Atomic, zero-config, single-file backup. |
| **Queue/Cron** | `node-cron` | Simplifies stack by removing Redis/BullMQ. |
| **Container** | Docker + Alpine | Minimal attack surface, 100% VPS portability. |
| **Proxy** | Nginx | SSL termination and request buffering. |

## 4. Logical File Structure
```text
whatsapp-crm-swarm/
├── src/
│   ├── server.ts          # Express entry point & middleware config
│   ├── routes/
│   │   └── checks.ts      # CRUD for URLs + Manual execution trigger
│   ├── services/
│   │   ├── checker.ts     # Core logic: native fetch() + latency timing
│   │   └── alerter.ts     # WhatsApp/Webhook notification dispatcher
│   ├── db/
│   │   ├── schema.ts      # SQLite DDL (Tables: checks, logs, users)
│   │   └── queries.ts     # Pre-compiled SQL statements
│   └── scheduler.ts       # Cron initialization (every 1/5/15 min)
├── Dockerfile             # Multi-stage build (build -> production)
├── docker-compose.yml     # App + Nginx sidecar
├── nginx.conf             # Proxy pass + Header hardening
└── package.json           # Minimal deps (express, better-sqlite3, node-cron, zod)
```

## 5. Deployment Specs (Target: 89.167.83.218)
- **Persistence**: Volume mount `/data` for `checks.db`.
- **Port Strategy**: App:3000 -> Nginx:80/443.
- **Health Check**: `/health` endpoint for Docker/Nginx heartbeat.

## 6. Schema (Minimal)
- `checks`: id, name, url, frequency, last_status, is_active.
- `logs`: id, check_id, status_code, latency_ms, timestamp, error_msg.
