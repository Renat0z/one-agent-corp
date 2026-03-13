# Offer Design — profitbridge-ai

## OFFER DESIGN

### Core Value Proposition
> "For Shopify Scaling Founders, ProfitBridge AI is the Inventory-Aware Ad Controller that stops 100% of wasted ad spend on 'Out of Stock' products unlike manual CSV exports or generic inventory trackers."

### Pricing Model
- Model: Monthly Subscription + Tiered Usage (SKU-based)
- Tiers:
  | Tier | Price/mo | What's included | Target customer |
  |------|----------|-----------------|-----------------|
  | Starter | $49 | Up to 100 SKUs, Real-time Sync | Solo Founder / Boutique |
  | Pro | $149 | Up to 500 SKUs, Multi-channel Ads | Growing DTC Brands |
  | Business | $299 | Unlimited SKUs, Custom Rule Engine | High-volume E-com |

### Unit Economics
- Target ARPU (Average Revenue Per User): $120/month
- Estimated avg customer lifetime: 14 months
- LTV = ARPU × lifetime: $1,680
- Estimated CAC (acquisition cost): $400 (Google/Shopify App Store Ads)
- LTV/CAC ratio: 4.2x
- Payback period: 3.3 months

### Value Stacks (Hormozi style)
What do they get beyond the core product?
1. **The "Dead Link" Auto-Pauser** — value: $100/month (saves manual monitoring time)
2. **Profit-Margin Campaign Optimizer** — value: $200 (re-allocates budget to high-stock/high-margin items)
3. **The "Zero Waste" Guarantee** — 30-day money-back + We pay your first $50 of wasted ad spend if we miss a sync.

### Competitive Positioning
- Cheapest competitor: $29/month (Generic low-stock alerts only, no ad integration)
- Our price vs cheapest: Premium at 70% more (Starter) to 400% more (Pro)
- Why our price is justified: We don't just alert you; we automate the cost-saving action, directly recovering $500–$2,000/mo in wasted spend.

### Offer Validation Score (1-10): 9
Does LTV/CAC >= 3? YES | Payback < 12 months? YES

<<JSON>>
{
  "pricing_defined": true,
  "price_starter_usd": 49,
  "price_pro_usd": 149,
  "arpu_usd": 120,
  "ltv_usd": 1680,
  "cac_estimate_usd": 400,
  "ltv_cac_ratio": 4.2,
  "payback_months": 3.3,
  "unit_economics_pass": true,
  "offer_validation_score": 9
}
<</JSON>>