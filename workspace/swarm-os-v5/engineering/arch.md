# Architecture — swarm-os-v5

## ARCHITECTURE SPECIFICATION

### Stack Decision
- **Runtime:** Node.js 20 (LTS) + TypeScript
- **Framework:** Express 4 (Simple, battle-tested)
- **Database:** SQLite (Better-sqlite3) — Ideal for local audit logs and high-speed metadata.
- **Security Core:** `cosign` (Binary integration) + `opa` (Open Policy Agent for Rego rules).
- **Scanner:** Custom LLM-based "Intent Matcher" (via OpenAI/Anthropic API).
- **Container:** Docker + Docker Compose (with Cosign binary pre-installed).

### File Structure
```
artifact-guard/
├── src/
│   ├── server.ts          — Entry point & Express setup
│   ├── routes/
│   │   ├── artifacts.ts   — Scan, Sign, and Verify endpoints
│   │   ├── policies.ts    — Policy management (Rego CRUD)
│   │   └── audit.ts       — Compliance log exports
│   ├── services/
│   │   ├── scanner.ts     — LLM Intent-to-Code validation logic
│   │   ├── policy-engine.ts — OPA wrapper for Rego evaluation
│   │   └── signer.ts      — Cosign shell wrapper for artifact signing
│   ├── db/
│   │   ├── schema.ts      — SQLite migrations (Artifacts, Logs, Results)
│   │   └── repository.ts  — Clean Data Access Layer
│   └── middleware/
│       └── validator.ts   — Request schema validation
├── policies/
│   └── security.rego      — Default OPA guardrails
├── Dockerfile             — Includes Node + Cosign + OPA binaries
├── docker-compose.yml
└── package.json
```

### Key Technical Decisions
1. **Cosign Shell Integration:** We invoke the `cosign` binary directly for cryptographic operations to avoid maintaining complex JS-native crypto-signing for OCI.
2. **Intent Matcher (LLM):** The MVP uses a structured prompt to compare `task_context.json` against `git_diff`. If match < 0.8, signature is denied.
3. **Stateless Scanning:** Artifacts are scanned in-memory or in `/tmp`; only metadata and final "Signed" status are persisted in SQLite.
4. **Local OPA Execution:** Rego policies are evaluated locally within the container for sub-second latency.

### Environment Variables
```
PORT=3000
DB_PATH=/data/guard.db
COSIGN_PASSWORD=           # For private key signing
COSIGN_KEY_PATH=/keys/     # Path to cosign.key
OPENAI_API_KEY=            # For Intent-to-Code LLM analysis
POLICY_DIR=./policies      # Where .rego files live
```

### Deploy Target
- **VPS:** 89.167.83.218
- **Port:** 3000 (Internal) -> Nginx Reverse Proxy (:443)
- **Directory:** `/opt/artifact-guard`
- **Volume:** `/data` (SQLite persistence) and `/keys` (Cosign keys) mounted from host.