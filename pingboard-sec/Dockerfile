FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx tsc

FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache python3 make g++ # Required for better-sqlite3 build if not pre-built
COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
RUN mkdir -p /app/data
ENV PORT=3000
ENV DB_PATH=/app/data/checks.db
EXPOSE 3000
CMD ["node", "dist/server.js"]
