# QA Department — Evaluation Rubric

Score outputs 1-10.

## Scoring Dimensions

### Test Coverage (0-3)
- 3: 15+ tests covering happy path, edge cases, errors
- 2: 8-14 tests, most scenarios covered
- 1: Fewer than 8 tests or missing key scenarios
- 0: No real tests

### E2E Quality (0-2)
- 2: Complete Playwright tests for main user flows
- 1: Partial E2E coverage
- 0: No E2E tests

### Security Thoroughness (0-3)
- 3: All OWASP Top 10 assessed with specific evidence and recommendations
- 2: Most OWASP items assessed
- 1: Surface-level security review
- 0: No security review

### Code Quality (0-2)
- 2: Tests are well-structured, readable, with clear arrange/act/assert
- 1: Tests work but poorly organized
- 0: Tests don't follow best practices

### Commercial Readiness (0-3)
- 3: ICP named + distribution channel defined + pricing live + payment flow tested
- 2: ICP named + channel defined but pricing or payment not verified
- 1: ICP named but no distribution channel or pricing
- 0: No commercial validation — product will deploy with no path to revenue

**Pass threshold: 7/10**
**Hard block: Commercial Readiness = 0 → auto-fail regardless of technical score**
