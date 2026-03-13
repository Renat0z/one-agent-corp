# Market Validation — pingboard

## MARKET VALIDATION

### Pain Score (1-10): 8
**Why it hurts:** Downtime silently kills revenue — every minute an API or URL is offline costs e-commerce, SaaS, and fintechs real money, and most teams only discover failures *after* customers complain. WhatsApp as the alert channel is a genuine differentiator in Latin America, where it's the default business communication tool and has near-100% open rates vs. email noise.

---

### Target Customer
- **Profile:** CTOs / Dev leads at B2B SaaS, e-commerce, and fintechs in Brazil/LATAM with 5–100 engineers and production APIs they can't afford to ignore.
- **Budget:** R$150–R$800/month (≈ $30–$160 USD), with enterprise tiers reaching R$2.000+.
- **Urgency:** PIX, Open Finance, and LGPD compliance requirements are forcing LATAM companies to have formal uptime monitoring — regulatory pressure makes "we don't monitor" a liability.

---

### Competition Snapshot

| Competitor | Weakness | Our Edge |
|---|---|---|
| **UptimeRobot** | No WhatsApp alerts, English-first UX, US-centric pricing | Native PT-BR, WhatsApp-first alerting, BRL pricing |
| **Datadog / New Relic** | Expensive ($$$), complex setup, overkill for small teams | 5-minute setup, zero DevOps overhead, focused scope |
| **BetterUptime** | WhatsApp only via Zapier (paid integration), no LATAM focus | Built-in WhatsApp via Evolution API, no middleware cost |

---

### Revenue Potential
- **TAM:** ~$2.1B/year globally (website/API monitoring SaaS, 2025 est.) — Brazil slice ≈ $80–120M/year
- **Realistic Year-1 MRR:** $3.500–$8.000 USD (35–80 paying customers at average $100/month)
- **Pricing Model:** Subscription (tiered by number of endpoints + check frequency + seats)

```
Starter  → R$99/mo   → 10 endpoints, 5min checks, 1 WhatsApp
Pro      → R$299/mo  → 50 endpoints, 1min checks, 3 WhatsApp
Business → R$799/mo  → unlimited endpoints, 30s checks, API access
```

---

### BUILD DECISION
- **Verdict:** ✅ GO
- **Reason:** High pain, validated demand, defensible LATAM moat via WhatsApp-native alerting, buildable in under 3 weeks as a focused MVP.
- **Recommended Stack:** `Node.js (Fastify) + PostgreSQL + BullMQ (Redis) + Evolution API (WhatsApp) + Docker + Render/Railway`
- **Estimated Build Time:** **14–18 days** (solo dev, MVP scope)

---

### Key Risks (top 3)

1. **WhatsApp API instability** — Evolution API / Meta Business API bans/limits can break core alerting; mitigate with multi-channel fallback (Telegram, SMS via Twilio).
2. **Race to zero on pricing** — UptimeRobot has a generous free tier that anchors price expectations; must win on *channel preference* (WhatsApp) and *language*, not price.
3. **Churn from "set and forget"** — Users activate during an incident, then cancel when things are stable; mitigate with weekly digest reports and uptime SLA certificates (generates perceived value even when silent).