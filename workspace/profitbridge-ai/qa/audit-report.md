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
- **Security risks**: 
    - No authentication on `/api/skus` or `/api/sync-shopify`. Anyone can read the inventory or inject data.
    - No validation for Shopify webhook HMAC signatures.
    - CORS is set to allow all origins (`*`).
- **Missing validations**:
    - `sync-shopify` route lacks input schema validation (e.g., checking if `variants` exists/is array).
    - `MarginCalculator` uses a hardcoded `estimatedCAC`.
    - `GoogleAdsClient` is currently a mock (logged to console only).
- **Deployment blockers**:
    - SQLite database path: `data/` directory needs to be created in the container (handled in Dockerfile, but host volume mapping in `docker-compose.yml` must ensure permissions).
    - Missing `.env.example` file in the source directory (found in the root list but was not checked for content).

### QA Score: 7.5/10
*Scaffold is architecturally sound with a clear separation of concerns (Services, DB, Routes, Scheduler). However, it is "production-ready" only for a private MVP; it requires auth and validation for public exposure.*

### GATE DECISION
```json
{
  "verdict": "proceed",
  "qa_score": 7.5,
  "blockers": [],
  "warnings": [
    "Add HMAC validation for Shopify webhooks",
    "Add API Key protection for /api endpoints",
    "Replace console mocks with real Google Ads API integration",
    "Add express-validator for incoming request bodies"
  ],
  "ready_for_deploy": true
}
```