# Market Validation — profitbridge-ai

## MARKET VALIDATION

### Pain Score (1-10): 9
Why it hurts: E-commerce stores lose 15-30% of their budget by driving traffic to "Out of Stock" pages or overstocking low-margin items. The disconnect between marketing spend and physical inventory creates a direct, measurable cash leak that keeps founders awake.

### Target Customer
- Profile: Shopify/WooCommerce store owners doing $20k-$100k/mo with 50+ SKUs.
- Budget: $49 - $149 monthly (Willingness to pay ~10% of recovered ad waste).
- Urgency: Rising CAC (Customer Acquisition Cost) makes every wasted click a threat to net profitability.

### Competition Snapshot
| Competitor | Weakness | Our Edge |
|---|---|---|
| TripleWhale | Expensive; Enterprise focus | Micro-SaaS pricing for mid-market |
| Stocky (Shopify) | No native Ad-platform sync | Real-time Google/Meta API automation |
| Manual Sheets | High latency; Human error | "Set and Forget" automated bid pausing |

### Revenue Potential
- TAM: $1.2B/year (Global Shopify/E-com automation niche)
- Realistic Year-1 MRR: $8,500 (Targeting 100-150 active installs)
- Pricing Model: Subscription (Tiered based on SKU count or Ad Spend managed)

### BUILD DECISION
- Verdict: GO
- Reason: High pain intensity with a clear, quantifiable ROI that simplifies the "Yes" decision for the ICP.
- Recommended Stack: Node.js (Fastify) + Prisma + PostgreSQL + BullMQ (for sync jobs).
- Estimated Build Time: 14 days (MVP: Auto-pause Google Ads on 0 stock).

### Key Risks (top 3)
1. API Rate Limits: Frequent inventory polling vs. Shopify/Google Ads API quotas.
2. Attribution Lag: Delay between stock hitting zero and Ad platforms reflecting the "Paused" state.
3. Platform Risk: Shopify or Google releasing native "Out of Stock" ad-suppression features.