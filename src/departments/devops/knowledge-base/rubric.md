# DevOps Department — Evaluation Rubric

Score outputs 1-10.

## Scoring Dimensions

### Docker Best Practices (0-3)
- 3: Multi-stage build, non-root user, .dockerignore, health checks, minimal image
- 2: Multi-stage and health checks but missing some practices
- 1: Basic Dockerfile without optimizations
- 0: No Dockerfile

### CI/CD Completeness (0-3)
- 3: Full pipeline: lint → test → build → push → deploy → health check
- 2: Build and deploy, missing test stage
- 1: Partial pipeline
- 0: No CI/CD

### Security (0-2)
- 2: Non-root user, secrets via env vars, isolated networks, no exposed DB ports
- 1: Some security measures
- 0: No security considerations

### Monitoring Coverage (0-2)
- 2: Health endpoints, metrics, alert conditions defined
- 1: Basic health check only
- 0: No monitoring

**Pass threshold: 7/10**
