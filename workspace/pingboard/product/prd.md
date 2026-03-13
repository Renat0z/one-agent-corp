# PRD — pingboard

## PRODUCT REQUIREMENTS DOCUMENT
### Project: **Pingboard** — Health Check & URL Monitoring with WhatsApp Alerts
> *Version 1.0 — MVP | Department of Product, One Agent Corp*

---

### North Star Metric
**% of monitored endpoints that triggered at least one WhatsApp alert successfully delivered within 60 seconds of a real downtime event** — this single metric proves both the monitoring engine and the alert channel work as a unit.

---

### MVP Scope (MUST-HAVE only)

| Feature | Why Critical | Effort |
|---|---|---|
| **URL/API Health Check Engine** | Core product — without reliable polling there is nothing to sell | M |
| **WhatsApp Alert Delivery** (via Evolution API) | The entire differentiation hypothesis lives here; must validate before anything else | M |
| **Multi-channel Fallback** (Telegram or email) | Architectural constraint flagged by Strategy Gate — WhatsApp API fragility cannot be a single point of failure | S |
| **Dashboard (read-only web UI)** | CTOs need visual proof of uptime history to justify paying; pure API is not enough for this ICP | M |
| **Webhook-based Alert Config per Check** | Allows each team to route alerts to the right WhatsApp number/group without a full user management system | S |

> **Explicitly OUT of MVP scope:** User auth/OAuth, team management, status pages, SSL cert monitoring, multi-region checks, billing integration. These are post-PMF.

---

### User Stories (top 3)

1. **As a** CTO at a Brazilian fintech, **I want to** register my PIX API endpoint and receive a WhatsApp message within 60 seconds when it goes down, **so that** I can act before customers notice and before a regulatory SLA breach occurs.

2. **As a** dev lead, **I want to** see the full uptime history of all my monitored URLs in a single dashboard, **so that** I can identify recurring instability patterns and bring evidence to infrastructure discussions.

3. **As a** backend engineer on-call, **I want to** receive a "recovery" WhatsApp alert when a previously down endpoint comes back online, **so that** I know the incident is resolved without manually rechecking the dashboard.

---

### API Endpoints (REST)

```
POST   /api/checks              — create health check
GET    /api/checks              — list all checks (with current status)
GET    /api/checks/:id          — get check detail + uptime history
PATCH  /api/checks/:id          — update interval, name, alert config
DELETE /api/checks/:id          — remove check + associated alerts

POST   /api/checks/:id/run      — trigger manual check (returns result immediately)

GET    /api/checks/:id/alerts   — list alert history for a check
GET    /api/checks/:id/stats    — uptime % last 24h / 7d / 30d

POST   /api/alerts/test         — send test WhatsApp message to validate channel config
```

---

### Data Model

```typescript
Check {
  id:               uuid (PK)
  name:             string
  url:              string
  method:           "GET" | "POST" | "HEAD"   // default: GET
  expected_status:  number                     // default: 200
  interval_seconds: number                     // min: 60, default: 300
  timeout_ms:       number                     // default: 5000
  status:           "up" | "down" | "unknown"
  last_checked_at:  timestamp
  last_status_change_at: timestamp
  created_at:       timestamp

  // Alert config (embedded, no separate table for MVP)
  alert_whatsapp:   string | null              // phone or group JID
  alert_email:      string | null              // fallback
  alert_telegram:   string | null              // fallback
}

Alert {
  id:         uuid (PK)
  check_id:   uuid (FK → Check)
  type:       "down" | "recovery"
  channel:    "whatsapp" | "telegram" | "email"
  status:     "sent" | "failed"
  message:    string
  response_time_ms: number | null             // latency at moment of failure
  http_status: number | null                  // actual HTTP code received
  sent_at:    timestamp
  error_log:  string | null                   // if channel delivery failed
}

CheckResult {
  id:           uuid (PK)
  check_id:     uuid (FK → Check)
  status:       "up" | "down"
  http_status:  number | null
  response_time_ms: number
  checked_at:   timestamp
  error_detail: string | null
}
```

---

### Success Criteria (MVP done when):

1. **Alert latency ≤ 60s** — A URL that goes offline is detected and a WhatsApp message is delivered to the configured number within 60 seconds, measured end-to-end in a controlled test with 5 different endpoints.

2. **Fallback works without human intervention** — When WhatsApp delivery fails (Evolution API error), the system automatically retries via the configured fallback channel (Telegram/email) within 30 seconds, logged in `Alert.error_log`.

3. **10 paying beta customers onboarded** — At least 10 real companies have a registered check, received at least one real alert (down or recovery), and have not churned within the first 14 days — this is the PMF signal, not a technical milestone.

---

> **Ries note:** Do not build billing, do not build team roles, do not build a status page. Charge manually (Pix/invoice) for the first 10 customers. Learn what they actually use before writing a line of code for anything outside this PRD.
>
> **Cagan note:** The dashboard is not optional — it is the artifact that creates perceived value even on silent weeks. Without it, the product feels like a black box and CTOs cancel.