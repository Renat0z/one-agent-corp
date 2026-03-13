#!/bin/bash
set -e

PROJECT="micro-saas-opportunities-2026"
VPS="89.167.83.218"
DEPLOY_DIR="/opt/$PROJECT"

echo "🚀 Deploying $PROJECT to $VPS..."

# Create project directory
ssh root@$VPS "mkdir -p $DEPLOY_DIR/data"

# Sync files
rsync -avz --delete \
  --exclude='node_modules' \
  --exclude='.env' \
  C:\Users\Administrador\OneDrive\Documentos\0 SPEEDGROW\one-agent\one-agent-corp\workspace\micro-saas-opportunities-2026/src/ root@$VPS:$DEPLOY_DIR/src/

# Sync infra files
for f in package.json Dockerfile docker-compose.yml nginx.conf; do
  scp C:\Users\Administrador\OneDrive\Documentos\0 SPEEDGROW\one-agent\one-agent-corp\workspace\micro-saas-opportunities-2026/src/$f root@$VPS:$DEPLOY_DIR/ 2>/dev/null || true
done

# Create .env on VPS
ssh root@$VPS "cat > $DEPLOY_DIR/.env << 'EOF'
PORT=3000
DB_PATH=/data/checks.db
CHECK_TIMEOUT_MS=5000
NODE_ENV=production
EOF"

# Build and start
ssh root@$VPS "cd $DEPLOY_DIR && docker-compose down --remove-orphans; docker-compose up -d --build"

echo "✅ Deploy complete. Check: http://$VPS/api/checks"
