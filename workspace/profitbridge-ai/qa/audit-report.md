# QA Audit — profitbridge-ai

## QA AUDIT REPORT

### Completeness Check
| File | Required | Present | Status |
|---|---|---|---|
| src/server.ts | YES | YES | ✅ |
| package.json | YES | YES | ✅ |
| Dockerfile | YES | YES | ✅ |
| docker-compose.yml | YES | YES | ✅ |
| nginx.conf | YES | YES | ✅ |

### Risk Assessment
- **Security risks:**
    - **Missing Webhook Validation:** `src/routes/webhooks.ts` accepts Shopify webhooks without verifying the `X-Shopify-Hmac-Sha256` header. This allows spoofed requests to pause/enable Google Ads campaigns.
    - **Hardcoded Secrets Risk:** While `.env.example` is present, the logic in `LedgerService` uses a hardcoded `avgCpc`.
    - **No Authentication:** API routes for `/api/ads` (if expanded) lack any Bearer/API Key protection.
- **Missing Validations:**
    - **Input Sanitization:** Webhook payload destructuring (`sku`, `available`) lacks type checking or Zod-like validation before hitting the DB.
    - **Database Constraints:** SQLite `mappings` table lacks a `NOT NULL` constraint on `sku`.
- **Deployment blockers:**
    - **File Structure Inconsistency:** The files are currently nested under `workspace/profitbridge-ai/src/src/`, which will cause `tsc` and Docker `COPY` commands to fail unless the path is corrected or `tsconfig.json` (currently missing from provided list) is configured specifically for this nesting.
    - **Build Dependencies:** `better-sqlite3` requires build tools in the final Docker stage or a pre-compiled binary. The Dockerfile currently adds `python3 make g++` in the final stage but doesn't run a build there.

### QA Score: 6.5/10

### GATE DECISION
```json
{
  "verdict": "fail",
  "qa_score": 6.5,
  "blockers": [
    "Missing Shopify Webhook HMAC verification (Critical Security Risk)",
    "File structure mismatch (src/src/ nesting will break standard builds)",
    "Missing tsconfig.json required for compilation"
  ],
  "warnings": [
    "Move hardcoded Ledger values to config",
    "Add Zod validation for incoming payloads",
    "Implement rate limiting on webhook endpoints"
  ],
  "ready_for_deploy": false
}
```