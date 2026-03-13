# PRD — profitbridge-ai

## PRODUCT REQUIREMENTS DOCUMENT: ProfitBridge AI (MVP)

### North Star Metric
**Ad Waste Recovered ($)** — Total value of ad spend automatically paused or redirected from Out-of-Stock (OOS) product pages.

### MVP Scope (MUST-HAVE only)
| Feature | Why critical | Effort (S/M/L) |
|---|---|---|
| Shopify Inventory Sync | Real-time truth of what is actually sellable to avoid "ghost" clicks. | M |
| Google Ads API Bridge | Core automation; allows the system to pause/enable ad groups based on stock. | L |
| SKU-to-Ad Group Mapping | Links physical inventory to specific marketing assets. | S |
| Automation Dashboard | Provides visibility into which ads were paused and how much budget was saved. | S |
| Emergency Manual Override | Safety net for founders to resume ads regardless of stock status. | S |

### User Stories (top 3)
1. **As a Shopify Store Owner**, I want to automatically pause my Google Shopping ads when an item hits 0 stock so that I stop paying for clicks that result in "Page Not Found" or "Sold Out" bounces.
2. **As a Marketing Manager**, I want to receive a notification when an ad is paused due to stockouts so that I can reallocate that daily budget to high-performing, in-stock alternatives.
3. **As a Founder**, I want to see a "Saved Spend" report so that I can justify the monthly subscription cost based on prevented waste.

### API Endpoints (REST)
```
POST   /api/sync/shopify    — Webhook receiver for inventory level changes
GET    /api/inventory       — List mapped SKUs and their current sync status
POST   /api/mapping         — Link a Shopify SKU ID to a Google Ad Group ID
GET    /api/analytics/waste — Get total "Recovered Spend" metrics for the dashboard
POST   /api/ads/toggle      — Manual override to force-pause or force-enable an ad
```

### Data Model
```
ProductMapping {
  id, 
  shopify_product_id, 
  google_ad_group_id, 
  sku, 
  current_stock: integer,
  is_active: boolean,
  last_sync_at: datetime
}

AutomationLog {
  id, 
  product_mapping_id, 
  action: "PAUSE" | "RESUME", 
  reason: "OOS" | "RESTOCK" | "MANUAL",
  estimated_saving: decimal,
  created_at: datetime
}
```

### Success Criteria (MVP done when):
1. **End-to-End Automation:** Changing stock to 0 in Shopify triggers a "Pause" status in the linked Google Ads account within < 5 minutes.
2. **Auto-Recovery:** Increasing stock above 0 in Shopify successfully resumes the linked Google Ad group.
3. **Accuracy:** Zero instances of "false pauses" (pausing an item that actually has stock) during the first 48-hour soak test.