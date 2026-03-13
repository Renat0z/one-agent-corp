# Technical Architecture - ProfitBridge AI

## 1. System Design: The Synchronization Engine

The core of ProfitBridge AI is a high-frequency synchronization engine that maps ERP Inventory Levels to Ad Platform Statuses.

### Data Flow Pipeline
1. **ERP Ingestion Layer:**
   - **Bling/Tiny Webhooks:** Listen for `stock.update` events.
   - **Polling Service:** Fallback cron job (every 30 mins) to ensure consistency.
2. **Profit Intelligence Layer:**
   - **DOI Calculator:** (Current Stock / Avg Daily Sales 30d) = Days of Inventory.
   - **Threshold Logic:**
     - `DOI < 3`: Critical. Trigger "Soft-Cap" (Reduce Budget 90%).
     - `Stock == 0`: Empty. Trigger "Pause".
     - `DOI > 7`: Healthy. Trigger "Restore/Scale".
3. **Ad Execution Layer:**
   - **Google Ads API:** Update AdGroup/Campaign status.
   - **Meta Ads API:** Update AdSet budget (to avoid Learning Phase reset).

## 2. Tech Stack

- **Backend:** Node.js (TypeScript) + Fastify (High performance for webhooks).
- **Database:** PostgreSQL (Relational data for Product <-> Ad mapping).
- **Caching:** Redis (Store real-time stock levels to avoid ERP re-querying).
- **Task Queue:** BullMQ (Reliable retries for API calls to Google/Meta).
- **Authentication:** NextAuth.js (Google/Meta OAuth).

## 3. Data Schema (Core Entities)

### `Connections`
- `id`, `user_id`, `platform_type` (Bling/Meta/Google), `credentials_encrypted`.

### `ProductMapping`
- `id`, `user_id`, `erp_product_id`, `ad_platform_id` (Campaign/AdSet ID), `threshold_config`.

### `SyncLogs`
- `id`, `mapping_id`, `action_taken` (Paused/Reduced/Restored), `reason`, `timestamp`.

## 4. Security & Resilience

- **OAuth Scopes:** Minimum viable permissions (`ads_management`).
- **Encryption:** AES-256 for ERP/Ads API Keys at rest.
- **Circuit Breaker:** If Meta API returns 429 (Rate Limit), pause sync for that user for 15 mins.

---

# The Grand Slam Offer (Hormozi Style)

**Product:** ProfitBridge AI
**Target:** E-commerce owners spending $2k - $50k/mo on Ads with high SKU turnover.

### 1. The Dream Outcome
"Maximize your Net Profit by never wasting a single cent on ads for products you can't ship, while keeping your Meta algorithms healthy."

### 2. Perceived Likelihood of Achievement
- **Real-time ROI Calculator:** A free tool that shows exactly how much money was wasted in the last 30 days on out-of-stock items.
- **"Algorithm Safe" Technology:** We don't just pause; we manage budgets to keep your pixels warm.

### 3. Time Delay
"Setup to Sync in < 120 seconds. Connect your Bling and Meta Ads, and the first optimization happens instantly."

### 4. Effort & Sacrifice
"Zero manual rules. No more checking spreadsheets at 11 PM to see what sold out. We handle the mapping; you handle the growth."

### 5. The "Insurmountable" Guarantee (The Risk Reversal)
"**The 3X Wasted-Spend Guarantee:** If ProfitBridge doesn't save you at least 3x its monthly cost in wasted ad spend within the first 30 days, we'll refund your subscription AND pay for a professional audit of your ad account by a senior specialist. You literally cannot lose money by trying this."

### 6. Scarcity / Urgency
"Beta Batch: Only 15 slots available for Bling/Tiny early integrators to ensure 1-on-1 support during setup."
