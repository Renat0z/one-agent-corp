# Market Validation — profitbridge-ai

## MARKET VALIDATION

### Pain Score (1-10): 9
Why it hurts: Merchants lose 15-30% of ad spend on "ghost clicks"—traffic for out-of-stock items or products where CAC exceeds net margin. Standard tracking ignores COGS and shipping fluctuations, leading to "profitable" ROAS that results in actual bank account losses.

### Target Customer
- Profile: Shopify store owners doing $20k-$200k/mo with high SKU turnover (Fashion/Dropshipping).
- Budget: $99 - $299/month (10% of recovered wasted spend).
- Urgency: Rising CPMs on Meta/Google make efficiency a survival requirement, not an optimization.

### Competition Snapshot
| Competitor | Weakness | Our Edge |
|---|---|---|
| ProfitWell | SaaS focus; no ad automation. | Direct Google Ads "Kill-Switch" integration. |
| TripleWhale | Expensive ($300+/mo); attribution focus. | Low-cost SKU-level inventory/margin automation. |
| Simprosys | Feed management only; no margin logic. | Dynamic bid adjustment based on real net profit. |

### Revenue Potential
- TAM: $4.6B (Global Shopify App Market)
- Realistic Year-1 MRR: $12,000 - $18,000
- Pricing Model: Tiered Subscription ($99/$199/$499) based on SKU count.

### BUILD DECISION
- Verdict: GO
- Reason: High immediate ROI for users and low technical barrier to an MVP using webhooks.
- Recommended Stack: Node.js (Fastify) + Prisma + PostgreSQL + Redis (for webhook queuing).
- Estimated Build Time: 14 Days (MVP).

### Key Risks (top 3)
1. **API Latency:** Delay between stock-out and Google Ads pause resulting in wasted spend.
2. **Margin Complexity:** Difficulty in accurately capturing shipping/returns to calculate "Real Profit."
3. **Platform Dependency:** Sudden changes to Shopify Webhook or Google Ads API structures.