# PRD — profitbridge-ai

## PRODUCT REQUIREMENTS DOCUMENT: AI-Audit (ProfitBridge-AI)

### North Star Metric
**Total Recovered Revenue ($)** — The sum of canceled subscriptions with active access revoked + blocked shared logins (calculated by average LTV per seat).

### MVP Scope (MUST-HAVE only)
| Feature | Why critical | Effort (S/M/L) |
|---|---|---|
| **Hotmart/Kajabi API Sync** | Imports active student list and cross-references with payment status. | M |
| **Behavioral Fingerprinting** | Detects 3+ simultaneous IPs or rapid geographic shifts (Impossible Travel). | M |
| **Ghost Client Dashboard** | Visualizes "leaking" revenue and identifies specific accounts to be purged. | S |
| **Automated Access Kill-Switch** | One-click or automated API call to revoke platform access for "Ghost" users. | L |
| **Audit Log & ROI Report** | Proves the product paid for itself by listing exactly how much was saved. | S |

### User Stories (top 3)
1. **As an Infoproducer**, I want to identify students who canceled their subscription but still have access to the members' area, so I can stop providing a service I'm not being paid for.
2. **As a Course Manager**, I want to receive an alert when a single login is being used by more than 3 different devices/locations, so I can prevent "group-buy" piracy.
3. **As a Business Owner**, I want a monthly report showing the exact dollar amount recovered by the AI-Audit, so I can justify the SaaS ROI to my finance team.

### API Endpoints (REST)
```
POST   /api/sync           — Trigger platform data import (Hotmart/Kajabi)
GET    /api/audit/summary  — Get high-level recovery metrics (ROI, Ghost count)
GET    /api/audit/ghosts   — List detected ghost clients/flagged accounts
POST   /api/audit/revoke   — Batch revoke access for selected IDs
GET    /api/config/alerts  — Configure behavioral sensitivity thresholds
```

### Data Model
```
Client {
  id, platform_id, email,
  last_login_at, geo_fingerprint: [],
  access_status: "active"|"flagged"|"revoked",
  revenue_leak_value: decimal
}

AuditLog {
  id, client_id, 
  reason: "canceled_payment"|"shared_login"|"ip_anomaly",
  detected_at, action_taken: "none"|"auto_revoked"|"manual_flag",
  recovery_value: decimal
}
```

### Success Criteria (MVP done when):
1. **Integration Success:** System successfully pulls and reconciles data from at least one major platform (Hotmart/Kajabi/Stripe).
2. **Accuracy:** AI identifies at least 95% of "Ghost Clients" (canceled but active) in a sample dataset without false positives.
3. **Closing the Loop:** A user can revoke access to a flagged client directly from the ProfitBridge-AI dashboard.