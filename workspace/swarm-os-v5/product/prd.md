# PRD — swarm-os-v5

## PRODUCT REQUIREMENTS DOCUMENT

### North Star Metric
**% of Agent-generated Artifacts Signed and Validated without Human Intervention** (Zero-Touch Integrity Rate).

### MVP Scope (MUST-HAVE only)
| Feature | Why critical | Effort (S/M/L) |
|---|---|---|
| **Intent-to-Code Scanner** | Detects hallucinations by comparing the Agent's Task JSON vs. the generated File Diff. | M |
| **Cosign Artifact Signing** | Cryptographically signs artifacts only *after* security checks pass. | S |
| **Swarm-Native Policy Engine** | Basic Rego/OPA rules: "No hardcoded secrets" and "No unauthorized outbound URLs". | M |
| **Agentic Integrity API** | Allows the next agent in the flow to verify a "Clearance Token" before proceeding. | S |
| **Immutable Audit Log** | Records every validation decision for SOC2/Compliance readiness. | S |

### User Stories (top 3)
1. **As a DevOps Lead**, I want agent-generated code to be automatically scanned for intent-misalignment so that I can scale my team's velocity without increasing the manual review burden.
2. **As an AI Agent**, I want to receive a signed cryptographic token for my output so that the Deployment Agent accepts my work into the production registry.
3. **As a CTO**, I want a tamper-proof log of which agent created which artifact and who (or what) validated it for security compliance.

### API Endpoints (REST)
```
POST   /api/artifacts/scan    — submit artifact + task context for validation
GET    /api/artifacts/:id     — get integrity status and signature details
POST   /api/policies          — define/update security guardrails (e.g., forbidden libs)
GET    /api/audit/logs        — export compliance report for a specific workflow
POST   /api/verify            — check if a specific artifact hash is signed and valid
```

### Data Model
```
Artifact {
  id, hash, source_agent_id, 
  status: "pending"|"valid"|"quarantined"|"signed",
  signature_id, scanned_at, created_at
}
ValidationResult {
  id, artifact_id, 
  intent_match_score: float,
  vulnerabilities_found: [],
  policy_verdict: "pass"|"fail",
  raw_log_path
}
```

### Success Criteria (MVP done when):
1. **The Guard successfully blocks** an artifact containing a simulated "hallucination" (e.g., code adding a dependency not requested in the context).
2. **Total validation latency** (Scan + Sign) is under 8 seconds per artifact.
3. **Integration Test passes:** Agent A produces code -> ArtifactGuard validates/signs -> Agent B verifies signature and "deploys" (mocks) to a registry.