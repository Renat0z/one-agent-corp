# PRD — micro-saas-opportunities-2026

## PRODUCT REQUIREMENTS DOCUMENT: "HormoziHook" (High-Ticket Appointment Closer)

### North Star Metric
**Show-up Rate Improvement:** Percentage increase in confirmed attendees for scheduled calls compared to the user's previous baseline.

### MVP Scope (MUST-HAVE only)
| Feature | Why critical | Effort (S/M/L) |
|---|---|---|
| **Qualification Funnel** | Filters out "tire-kickers" before they hit the calendar. | M |
| **Indoctrination Page** | Forces lead to watch a video/read "homework" to unlock the slot. | S |
| **WhatsApp/SMS Urgency** | Uses Evolution API for high-open rate reminders vs. ignored emails. | M |
| **Stripe Deposit Integration**| Optional "Skin in the game" ($50-100 deposit) to book. | S |
| **Simple Dashboard** | Visualizes "Lost Revenue" vs "Recovered Revenue". | S |

### User Stories (top 3)
1. As a **High-Ticket Closer**, I want to **automatically disqualify leads who don't meet my budget criteria** so that I only spend time on $5k+ opportunities.
2. As an **Agency Owner**, I want to **send automated "Value-Bombs" via WhatsApp 24h before the call** so that the lead is pre-sold before I speak to them.
3. As a **Consultant**, I want to **require a refundable deposit for high-demand slots** so that I eliminate no-shows entirely.

### API Endpoints (REST)
```
POST   /api/funnels          — Create a qualification workflow
GET    /api/funnels/:id      — Get funnel configuration & stats
POST   /api/bookings         — Process a new booking attempt
POST   /api/webhooks/payment — Handle Stripe deposit confirmations
POST   /api/messages/send    — Trigger manual/auto WhatsApp indoctrination
```

### Data Model
```
Funnel {
  id, owner_id, name,
  video_url, min_budget_threshold,
  deposit_enabled: boolean, deposit_amount
}
Booking {
  id, funnel_id, lead_name, lead_phone,
  status: "pending_qualification" | "confirmed" | "no_show" | "attended",
  payment_intent_id, scheduled_at
}
MessageLog {
  id, booking_id, type: "reminder" | "indoctrination",
  provider: "whatsapp" | "sms", sent_at, status
}
```

### Success Criteria (MVP done when):
1. A user can create a 3-step funnel (Survey -> Indoctrination Video -> Calendar).
2. Automated WhatsApp reminders are successfully triggered via Evolution API based on the `scheduled_at` timestamp.
3. The dashboard correctly calculates "Recovered Value" based on the user's average deal size and improved show-up rate.