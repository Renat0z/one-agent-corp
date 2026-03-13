# PRD — profitbridge-ai-intel

## PRODUCT REQUIREMENTS DOCUMENT: ProfitBridge AI (MVP)

### North Star Metric
**Margin Recovery Velocity:** Total "Invisible Leak" dollars identified and actioned by the user within the first 14 days of integration.

### MVP Scope (MUST-HAVE only)
| Feature | Why critical | Effort (S/M/L) |
|---|---|---|
| **Multi-Source Data Sync** | Validates the "Anti-fragmentation" value by pulling from Stripe/QuickBooks/Banks. | L |
| **Profit Guard Alerts** | The core differentiator; shifts from retrospective accounting to proactive notification. | M |
| **Automated Reconciliation** | Eliminates the "Manual Sheets" pain point immediately. | M |
| **Cash Flow Runway Predictor** | Addresses the "Survival Strategy" urgency for SMBs under high interest rates. | S |
| **Unified Margin Dashboard** | Provides the "Real-time Insight" that ERPs lack for non-financial founders. | S |

### User Stories (top 3)
1. As a **Lean Agency Founder**, I want to **connect my bank and stripe accounts** so that I can **see my true net margin after ad spend and payroll in real-time.**
2. As an **E-commerce Operator**, I want to **receive a 'Profit Guard' alert** when **CAC exceeds LTV on a specific SKU** so that I can **stop burning capital on unprofitable products.**
3. As a **Time-poor SMB Owner**, I want an **automated monthly runway forecast** so that I can **make hiring or investment decisions without opening a spreadsheet.**

### API Endpoints (REST)
```
POST   /api/integrations  — connect financial data source (OAuth/API Key)
GET    /api/dashboard     — retrieve unified margin and runway metrics
GET    /api/alerts        — list active profit leaks and recommendations
POST   /api/alerts/:id/fix — acknowledge and trigger automated mitigation
GET    /api/forecast      — get predictive cash flow modeling
```

### Data Model
```
Organization {
  id, name, industry, 
  currency, fiscal_start_month
}
Source {
  id, org_id, type: "stripe"|"qbo"|"plaid",
  status: "linked"|"error", last_sync_at
}
Transaction {
  id, source_id, amount, category,
  timestamp, type: "income"|"expense",
  is_reconciled: boolean
}
Insight {
  id, org_id, severity: "critical"|"warning",
  type: "margin_drop"|"burn_rate_spike",
  impact_value, suggested_action
}
```

### Success Criteria (MVP done when):
1. **Zero-Touch Sync:** A user can connect one data source and see a populated dashboard in < 2 minutes.
2. **Leak Detection:** The system successfully identifies at least one "Invisible Leak" (e.g., duplicate subscription or margin erosion) during the first sync.
3. **Retention Signal:** 40% of beta users log in at least 3x per week to check the "Profit Guard" status.