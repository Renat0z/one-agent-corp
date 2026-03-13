# Architecture — profitbridge-ai

### ARCHITECTURE SPECIFICATION: ProfitBridge AI (MVP)
**Department of Engineering Architecture**
**Lead Architect:** Martin Fowler Mindset (Clean, Minimal, Evolutionary)

---

### 1. System Design Philosophy
"Every line of code is a liability." We prioritize **Zero-Infrastructure Persistence** and **Native Node.js capabilities** to minimize moving parts while ensuring the "Ad Waste Recovered" North Star metric is accurately tracked.

### 2. File Structure (The Implementation Blueprint)
```text
profitbridge-ai/
├── src/
│   ├── server.ts            # Entry point: Express + Middleware
│   ├── routes/
│   │   ├── webhooks.ts      # Shopify Inventory Webhook (Hmac verified)
│   │   └── ads.ts           # Google Ads Mapping + Manual Override
│   ├── services/
│   │   ├── inventory.ts     # Shopify Logic (Sync + Stock Checks)
│   │   ├── google-ads.ts    # API Bridge (Pause/Enable AdGroups)
│   │   └── ledger.ts        # "Saved Spend" calculation logic
│   ├── db/
│   │   ├── schema.ts        # better-sqlite3 tables (Mapping/Logs)
│   │   └── queries.ts       # Prepared statements for performance
│   └── scheduler.ts         # node-cron: Periodic full-sync (Safety net)
├── data/                    # Volume-mapped directory for SQLite
├── .env.example             # Template for API Keys
├── .gitignore               # node_modules, .env, /data/*.db
├── Dockerfile               # Node 20-alpine build
└── docker-compose.yml       # App + Nginx + SQLite Volume
```

### 3. Database Schema (SQLite via `better-sqlite3`)
Minimal relational model to link physical items to marketing spend.
```sql
CREATE TABLE product_ad_map (
  sku TEXT PRIMARY KEY,
  shopify_id TEXT NOT NULL,
  google_ad_group_id TEXT NOT NULL,
  current_stock INTEGER DEFAULT 0,
  is_paused BOOLEAN DEFAULT 0,
  manual_override BOOLEAN DEFAULT 0
);

CREATE TABLE savings_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sku TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  action TEXT, -- 'PAUSE' or 'RESUME'
  estimated_daily_budget REAL,
  saved_amount REAL DEFAULT 0
);
```

### 4. Technical Implementation Decisions
1.  **Shopify Webhooks**: Use `inventory_levels/update`. This ensures near real-time reaction to stockouts without polling Shopify's API limits.
2.  **Google Ads API Strategy**: Use the `google-ads-api` client. Actions are scoped strictly to `AdGroupStatus = 'PAUSED'` to prevent accidental deletion of campaigns.
3.  **Atomic Persistence**: SQLite is stored in a Docker Volume (`/data`). This allows for zero-downtime migrations and easy backups of the entire system state by simply copying one file.
4.  **Security**:
    *   **Hmac Verification**: All incoming Shopify webhooks must be verified using the `X-Shopify-Hmac-Sha256` header.
    *   **Rate Limiting**: Express-rate-limit applied to `/api` to prevent API exhaustion.

### 5. Deployment & Environment
- **Runtime**: Node.js 20 LTS (Native `fetch` for Shopify/Google API calls).
- **Process Manager**: Docker Restart Policy (`unless-stopped`).
- **Nginx Config**: Reverse proxy to port 3000, handling SSL termination (Certbot) on the VPS.

### 6. Environment Variables (`.env`)
```bash
PORT=3000
DB_PATH=/data/profitbridge.db
SHOPIFY_API_SECRET=shpca_...
SHOPIFY_SHOP_NAME=your-store.myshopify.com
GOOGLE_ADS_CLIENT_ID=...
GOOGLE_ADS_CLIENT_SECRET=...
GOOGLE_ADS_DEVELOPER_TOKEN=...
GOOGLE_ADS_REFRESH_TOKEN=...
```

### 7. Success Verification (The "Fowler" Test)
The architecture is "Deploy-Ready" if:
1. `docker-compose up` initializes the SQLite file.
2. A POST to `/api/sync/shopify` with `inventory_quantity: 0` triggers a `googleAds.pauseAdGroup()` call.
3. The `savings_logs` table increments the "Saved Spend" metric based on the Ad Group's average CPC.