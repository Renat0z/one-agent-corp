# Offer Design — whatsapp-crm-swarm

## OFFER DESIGN

### Core Value Proposition
> "For owner-operators of multi-physician aesthetic clinics, WhatsApp CRM Swarm is the automated sales funnel that stops lead leakage and maps every Real spent in ads to a finished procedure, unlike generic CRMs that require manual data entry."

### Pricing Model
- Model: Monthly Subscription (SaaS)
- Tiers:
  | Tier | Price/mo | What's included | Target customer |
  |------|----------|-----------------|-----------------|
  | Starter | R$ 297 | 1 Instance, Kanban Basic, 2 Agents | Solo Clinic |
  | Pro | R$ 597 | 3 Instances, Auto-funnels, Dashboards | Growing Clinic (3-5 agents) |
  | Business | R$ 997 | Unlimited Instances, API Webhooks, Priority Support | Multi-unit/Large Clinic |

### Unit Economics
- Target ARPU (Average Revenue Per User): $110/month (~R$ 600)
- Estimated avg customer lifetime: 14 months
- LTV = ARPU × lifetime: $1,540
- Estimated CAC (acquisition cost): $350 (Meta Ads + Sales Demo)
- LTV/CAC ratio: 4.4x
- Payback period: 3.2 months

### Value Stacks (Hormozi style)
What do they get beyond the core product?
1. **Pre-built "Aesthetic Clinic" Funnel Templates** — value: $400 (One-time setup cost elsewhere)
2. **Evolution API Managed Hosting** — value: $30/month (Technical headache removed)
3. **ROI Dashboard for Meta Ads** — value: $50/month (Replaces manual spreadsheets)
4. **"Double Your Appointments" Guarantee** — 30-day money back if lead response time doesn't drop by 50%.

### Competitive Positioning
- Cheapest competitor: R$ 199/month (Generic WhatsApp tools with no CRM/Reports)
- Our price vs cheapest: Premium at 150% more (R$ 597 vs R$ 199)
- Why our price is justified: We don't just "connect" WhatsApp; we automate the medical sales process and prove ROI through the integrated dashboard.

### Offer Validation Score (1-10): 9
Does LTV/CAC >= 3? [YES] | Payback < 12 months? [YES]

<<JSON>>
{
  "pricing_defined": true,
  "price_starter_usd": 55,
  "price_pro_usd": 110,
  "arpu_usd": 110,
  "ltv_usd": 1540,
  "cac_estimate_usd": 350,
  "ltv_cac_ratio": 4.4,
  "payback_months": 3.2,
  "unit_economics_pass": true,
  "offer_validation_score": 9
}
<</JSON>>