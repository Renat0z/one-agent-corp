```dockerfile
# ─── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json tsconfig.json ./
RUN npm ci

COPY src/ ./src/
RUN npm run build

# ─── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

# curl for HEALTHCHECK; dumb-init for proper signal forwarding
RUN apk add --no-cache curl dumb-init

# Non-root user
RUN addgroup -S pingboard && adduser -S pingboard -G pingboard

# Production deps only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Compiled output from builder
COPY --from=builder /app/dist ./dist

# SQLite data directory — bind-mounted from docker volume
RUN mkdir -p /data && chown pingboard:pingboard /data

USER pingboard

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/server.js"]
```