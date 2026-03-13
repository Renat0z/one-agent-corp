# Architecture — profitbridge-ai

# ARCHITECTURE SPECIFICATION: ProfitBridge AI (MVP)
**Status:** Approved for Development | **Mindset:** Martin Fowler (Pragmatic & Evolutionary)

## 1. System Overview
ProfitBridge AI is a specialized middleware that synchronizes Shopify inventory/COGS data with Google Ads status. It uses a **reactive synchronization pattern** (webhooks) combined with a **scheduled safety reconciliation** (cron).

## 2. Component Blueprint

### A. Core Engine (Node.js 20)
*   **Logic:** `MarginCalculator` service. Formula: `(Price * (1 - GatewayFee)) - (COGS + Shipping + EstimatedCAC)`.
*   **Safety:** `KillSwitch` service. Hard-stop triggers for `stock <= minimum_floor` OR `margin < 5%`.
*   **Integration:** `ShopifyClient` (Rest/GraphQL) + `GoogleAdsClient` (gRPC/REST).

### B. Persistence (SQLite)
*   **Schema:** 
    *   `skus`: id, shopify_id, handle, price, cogs, shipping, stock, status (active/paused).
    *   `settings`: shop_url, access_token, google_refresh_token, margin_threshold, stock_floor.
    *   `audit_logs`: timestamp, sku_id, action (PAUSED/ENABLED), reason.

### C. Infrastructure
*   **Webhooks:** Express endpoints for `orders/fulfilled` and `products/update`.
*   **Scheduler:** `node-cron` running every 15 minutes to reconcile Google Ads status with internal DB state (detecting manual changes in Google Ads).

## 3. Detailed File Structure

```text
profitbridge-ai/
├── src/
│   ├── server.ts            # Entry: Middleware, Webhook Routes, Auth
│   ├── routes/
│   │   ├── shopify.ts       # OAuth + Webhook handlers
│   │   ├── google.ts        # Ads API Auth + Manual sync triggers
│   │   └── dashboard.ts     # SKU Health & Settings API
│   ├── services/
│   │   ├── calculator.ts    # Margin logic & SKU health grading
│   │   ├── ads-manager.ts   # Google Ads API wrappers (Pause/Enable)
│   │   └── shopify-sync.ts  # Inventory & COGS fetcher
│   ├── db/
│   │   ├── schema.ts        # SQLite table definitions (better-sqlite3)
│   │   └── queries.ts       # Data access layer
│   └── cron.ts              # 15-min reconciliation job
├── .gitignore               # Block .env, .db, node_modules
├── Dockerfile               # Multi-stage build for Node 20
├── docker-compose.yml       # App + Nginx + Volume mapping
└── nginx.conf               # Proxy pass + SSL termination helper
```

## 4. Security & Performance
*   **Auth:** `crypto.timingSafeEqual` for Shopify HMAC validation.
*   **Data Integrity:** WAL (Write-Ahead Logging) enabled on SQLite for concurrent read/write during webhook bursts.
*   **Rate Limiting:** `express-rate-limit` on all public `/api/webhooks` to prevent DoS.

## 5. Deployment Specs (Target: 89.167.83.218)
*   **Process Management:** Docker container auto-restart (always).
*   **Volumes:** `/data` mapped to host for `.db` persistence.
*   **CI/CD:** Simple `git pull && docker-compose up --build -d`.

```env
# .env.example
PORT=3000
DB_PATH=/data/profitbridge.db
SHOPIFY_API_KEY=...
SHOPIFY_API_SECRET=...
GOOGLE_ADS_CLIENT_ID=...
GOOGLE_ADS_CLIENT_SECRET=...
GOOGLE_ADS_DEVELOPER_TOKEN=...
```