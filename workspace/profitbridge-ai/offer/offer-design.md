# Offer Design — profitbridge-ai

## OFFER DESIGN

### Core Value Proposition
> "For high-volume Shopify operators, ProfitBridge AI is the automated profit-guard that eliminates 'ghost ad spend' by instantly killing Google Ads for low-stock or negative-margin SKUs, unlike standard ROAS trackers that ignore real-time COGS and inventory shifts."

### Pricing Model
- Model: Monthly Subscription + Scaled Usage (SKU-based)
- Tiers:
  | Tier | Price/mo | What's included | Target customer |
  |------|----------|-----------------|-----------------|
  | Starter | $99 | Up to 500 SKUs, 1 Google Ads Account, Hourly Sync | Solopreneur / Dropshipper |
  | Pro | $249 | Up to 2,500 SKUs, 3 Accounts, Real-time Webhooks | Growing Brand ($50k+/mo) |
  | Scale | $499 | Unlimited SKUs, Multi-currency, Priority Support | High-Volume Ops ($150k+/mo) |

### Unit Economics
- Target ARPU (Average Revenue Per User): $210/month
- Estimated avg customer lifetime: 14 months
- LTV = ARPU × lifetime: $2,940
- Estimated CAC (acquisition cost): $650 (Paid Search + Content)
- LTV/CAC ratio: 4.52x
- Payback period: 3.1 months

### Value Stacks (Hormozi style)
What do they get beyond the core product?
1. **Dynamic Margin Calculator** — value: $49/month (Automates COGS vs. Shipping vs. Ad Spend math)
2. **"Ghost Click" Audit Tool** — value: $197 (One-time report showing exactly where $ was wasted in the last 30 days)
3. **The "Profit-First" Guarantee** — If the tool doesn't identify and save more in wasted ad spend than the subscription cost in 30 days, your next month is free.

### Competitive Positioning
- Cheapest competitor: $49/month (Basic inventory alerts, no automated ad-kill)
- Our price vs cheapest: Premium at 100% more (Starter) to 400% more (Pro)
- Why our price is justified: Competitors only *alert* you to problems; we *execute* the kill-switch to stop the financial bleed instantly.

### Offer Validation Score (1-10): 9
Does LTV/CAC >= 3? YES | Payback < 12 months? YES

<<JSON>>
{
  "pricing_defined": true,
  "price_starter_usd": 99,
  "price_pro_usd": 249,
  "arpu_usd": 210,
  "ltv_usd": 2940,
  "cac_estimate_usd": 650,
  "ltv_cac_ratio": 4.52,
  "payback_months": 3.1,
  "unit_economics_pass": true,
  "offer_validation_score": 9
}
<</JSON>>