# PRD — pingboard-sec

## PRODUCT REQUIREMENTS DOCUMENT

### North Star Metric
**Mean Time to Aware (MTTA):** % of "Down" events delivered to the user's WhatsApp in under 60 seconds from the moment of detection.

### MVP Scope (MUST-HAVE only)
| Feature | Why critical | Effort (S/M/L) |
|---|---|---|
| **Headless Monitoring Engine** | Core functionality; performs the actual HTTP/GET ping to target URLs. | S |
| **WhatsApp Instance Manager** | Essential to link the user's phone via QR Code (Evolution API integration). | M |
| **State-Change Alert Logic** | Prevents spam; only sends messages when status flips (Up -> Down / Down -> Up). | S |
| **Basic CRUD API** | Allows users to programmatically manage their monitored URLs. | S |
| **Failure Persistence** | Logs failures to provide a basic "history" of downtime for the user. | S |

### User Stories (top 3)
1. **As a Freelancer**, I want to add my client's URL via API so that I am the first to know if their landing page crashes during a campaign.
2. **As an Agency Owner**, I want to pair my WhatsApp via QR Code so that I receive instant alerts without checking my email or Slack.
3. **As a Developer**, I want to receive a "Recovery" message on WhatsApp so that I know my fix worked and I can stop working.

### API Endpoints (REST)
```
POST   /api/auth/whatsapp — generates QR code/pairs instance
POST   /api/checks        — create health check (URL, interval)
GET    /api/checks        — list all active checks and current status
DELETE /api/checks/:id    — remove check
POST   /api/checks/:id/run — trigger manual check for instant validation
```

### Data Model
```
Check {
  id: uuid,
  url: string,
  name: string,
  interval_seconds: integer (default 60),
  status: "up" | "down" | "pending",
  whatsapp_instance_id: string,
  last_checked_at: timestamp,
  created_at: timestamp
}

Alert {
  id: uuid,
  check_id: uuid,
  type: "down" | "recovery",
  latency_ms: integer,
  message_sid: string, // From WA Provider
  sent_at: timestamp
}
```

### Success Criteria (MVP done when):
1. A user can connect a WhatsApp number via API/QR Code in under 2 minutes.
2. The system detects a simulated "404/500" error and delivers a WhatsApp message within 60 seconds.
3. The system correctly identifies a "Recovery" (200 OK) and notifies the user, ending the incident cycle.
4. 100% of alerts are delivered via WhatsApp (zero fallback to email for MVP).