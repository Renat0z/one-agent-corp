# Architecture — micro-saas-opportunities-2026

The architecture for **HormoziHook** is now fully defined and ready for deployment. This minimal, high-performance setup uses Node.js 20 with SQLite for zero-infrastructure persistence and Docker for portability.

### 📁 Final File Structure
```text
micro-saas-opportunities-2026/
├── src/
│   ├── server.ts          — Entry point & Express setup
│   ├── scheduler.ts       — Cron jobs for reminders
│   ├── routes/
│   │   └── checks.ts      — API endpoints (Funnels, Bookings)
│   ├── db/
│   │   └── schema.ts      — SQLite/Better-SQLite3 init
├── Dockerfile             — Node.js 20 slim build
├── docker-compose.yml     — Service orchestration (App + Nginx)
├── nginx.conf             — Reverse proxy config
├── package.json           — Dependencies (Express, Zod, Better-SQLite3)
└── tsconfig.json          — TypeScript config
```

### 🛠️ Key Technical Implementations
- **Security**: All API inputs are validated using **Zod**. `crypto.randomUUID` is used for all unique identifiers to prevent ID guessing.
- **Reminders**: A `node-cron` scheduler runs every hour, checking for confirmed bookings within the 24h window and firing webhooks (compatible with Evolution API).
- **Persistence**: **SQLite** is utilized via `better-sqlite3`, providing high-speed, local data storage without needing a separate database server.
- **Portability**: The entire stack is containerized. Running `docker-compose up -d` on the target VPS (`89.167.83.218`) will deploy the application behind an Nginx reverse proxy.

### 🚀 Deployment Command
```bash
cd micro-saas-opportunities-2026 && docker-compose up -d --build
```

### 📡 API Samples
- `POST /api/funnels`: Create a qualification workflow (min budget, indoctrination video URL).
- `POST /api/bookings`: Process a lead through the qualification filter.
- `GET /health`: Check system status and uptime.