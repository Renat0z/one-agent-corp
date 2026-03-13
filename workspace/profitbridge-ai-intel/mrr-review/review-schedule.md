# MRR Review Schedule — profitbridge-ai-intel

**Review Date:** 2026-04-12 (30 days post-deploy)
**Run this command on review date:**
```bash
npx tsx scripts/strategy-review.ts --project=profitbridge-ai-intel
```

## What to Measure
- MRR
- leads_generated
- activation_rate
- churn_rate
- nps

## Targets for 30-day Review
- MRR: $897 (3 paying customers)
- Leads: 600 leads in 30 days
- Channel: Cold Email

## Decision Rules
- **SCALE:** MRR growing + leads healthy + churn < 5%
- **OPTIMIZE:** MRR flat + leads healthy + churn < 5%
- **FIX_RETENTION:** MRR declining OR churn > 5%
- **KILL:** MRR = 0 after 60 days AND no PMF signal

## Before the Review — Update context.json
Update `workspace/profitbridge-ai-intel/context.json` with real numbers:
```json
{
  "revenue_snapshot": {
    "mrr": 0,
    "leads_this_cycle": 0,
    "activation_rate": 0,
    "churn_rate": 0,
    "nps": null
  }
}
```