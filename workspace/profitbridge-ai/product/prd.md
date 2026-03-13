# PRD — profitbridge-ai

## PRODUCT REQUIREMENTS DOCUMENT: ProfitBridge AI (MVP)

### North Star Metric
**Ad-Waste Recovered ($):** Total Google Ads spend automatically paused on SKUs with negative margin or zero stock.

### MVP Scope (MUST-HAVE only)
| Feature | Why critical | Effort (S/M/L) |
|---|---|---|
| Shopify Webhook Ingestion | Real-time sync of inventory levels and COGS updates. | M |
| Dynamic Margin Calculator | Connects Price - (COGS + Shipping + Estimated CAC) to determine SKU health. | S |
| Google Ads Kill-Switch | Automated API call to pause/enable specific Product Groups/Ads based on margin. | L |
| SKU Health Dashboard | Simple UI showing which products are "Burning Cash" vs "Profit Engines". | S |
| Manual Override / Safety Net | Allows merchants to set a "Minimum Stock" floor before auto-pausing. | S |

### User Stories (top 3)
1. As a **Shopify Merchant**, I want to **automatically pause ads for OOS items** so that I **don't waste budget on "Ghost Clicks"**.
2. As a **Store Owner**, I want to **input my COGS and shipping costs** so that the system **calculates my real net profit per SKU**.
3. As an **E-commerce Manager**, I want a **Kill-Switch to trigger when margin drops below 5%** so that I **protect my bottom-line during high-CPM periods**.

### API Endpoints (REST)
```
POST   /api/auth/shopify        — Install app & exchange tokens
POST   /api/webhooks/inventory  — Process Shopify inventory levels
GET    /api/skus                — List SKU health status & margins
PATCH  /api/skus/:id/config     — Set custom margin/stock thresholds
POST   /api/ads/sync            — Manually trigger Google Ads status update
```

### Data Model
```prisma
model Product {
  id               String   @id // Shopify ID
  sku              String   @unique
  price            Decimal
  cogs             Decimal
  shipping_est     Decimal
  inventory_qty    Int
  net_margin       Decimal
  is_paused_by_ai  Boolean  @default(false)
  threshold_stock  Int      @default(2)
  threshold_margin Decimal  @default(0.05)
  updated_at       DateTime @updatedAt
}

model AdAction {
  id         String   @id @default(uuid())
  sku        String
  action     String   // "PAUSE" | "ENABLE"
  reason     String   // "LOW_STOCK" | "NEG_MARGIN"
  executed_at DateTime @default(now())
}
```

### Success Criteria (MVP done when):
1. **Webhook Integrity:** Shopify inventory changes reflect in the ProfitBridge database in < 5 seconds.
2. **Automated Logic:** A SKU with stock = 0 or Margin < 0.00 triggers a "Pause" command to the Google Ads API.
3. **End-to-End Loop:** A merchant can see exactly why a specific ad was paused (e.g., "Margin dropped to -2% due to COGS update") in the dashboard.