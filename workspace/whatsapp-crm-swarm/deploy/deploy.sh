#!/bin/bash
set -e

PROJECT="whatsapp-crm-swarm"
VPS="89.167.83.218"
DEPLOY_DIR="/opt/$PROJECT"

echo "🚀 Deploying $PROJECT to $VPS..."
echo ""

# Get absolute path to project
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC_DIR="$PROJECT_ROOT/src"

echo "📦 Source: $SRC_DIR"
echo "🎯 Target: root@$VPS:$DEPLOY_DIR"
echo ""

# 1. Build locally first
echo "🔨 Building TypeScript locally..."
cd "$SRC_DIR"
npm run build > /dev/null 2>&1
echo "✅ Build successful"
echo ""

# 2. Create remote directory structure
echo "📁 Creating directories on VPS..."
ssh root@$VPS "mkdir -p $DEPLOY_DIR/{data,logs,src}"
echo "✅ Directories created"
echo ""

# 3. Create tarball of src (excluding node_modules and .env)
echo "📦 Packing source code..."
cd "$SRC_DIR"
tar --exclude='node_modules' \
    --exclude='.env' \
    --exclude='.git' \
    -czf /tmp/whatsapp-src.tar.gz .
echo "✅ Source packed"
echo ""

# 4. Upload tarball
echo "📤 Uploading to VPS..."
scp /tmp/whatsapp-src.tar.gz root@$VPS:/tmp/
echo "✅ Upload complete"
echo ""

# 5. Extract and setup on VPS
echo "🔧 Setting up on VPS..."
ssh root@$VPS << 'REMOTE_SCRIPT'
PROJECT="whatsapp-crm-swarm"
DEPLOY_DIR="/opt/$PROJECT"

cd "$DEPLOY_DIR"
tar xzf /tmp/whatsapp-src.tar.gz
rm /tmp/whatsapp-src.tar.gz

# Copy infra files if they don't exist at root
if [ ! -f "$DEPLOY_DIR/Dockerfile" ]; then
  cp "$DEPLOY_DIR/src/Dockerfile" "$DEPLOY_DIR/"
fi
if [ ! -f "$DEPLOY_DIR/docker-compose.yml" ]; then
  cp "$DEPLOY_DIR/src/docker-compose.yml" "$DEPLOY_DIR/"
fi
if [ ! -f "$DEPLOY_DIR/nginx.conf" ]; then
  cp "$DEPLOY_DIR/src/nginx.conf" "$DEPLOY_DIR/"
fi

echo "✅ Files extracted and configured"
REMOTE_SCRIPT

echo "✅ VPS setup complete"
echo ""

# 6. Create .env file on VPS
echo "⚙️  Creating .env configuration..."
ssh root@$VPS "cat > $DEPLOY_DIR/.env << 'EOF'
PORT=3000
NODE_ENV=production
DB_PATH=/data/crm.db
EVOLUTION_API_URL=https://api.evolution.example.com
EVOLUTION_API_KEY=sua_chave_aqui
EOF"
echo "✅ .env created (configure os valores conforme necessário)"
echo ""

# 7. Build Docker image and start containers
echo "🐳 Building Docker image and starting containers..."
ssh root@$VPS << 'DOCKER_SCRIPT'
PROJECT="whatsapp-crm-swarm"
DEPLOY_DIR="/opt/$PROJECT"

cd "$DEPLOY_DIR"

# Stop existing containers if any
docker compose down --remove-orphans 2>/dev/null || true

# Start containers with build
docker compose up -d --build

echo "✅ Containers started"
DOCKER_SCRIPT

echo ""

# 8. Wait for containers to be healthy
echo "⏳ Waiting for containers to be ready..."
sleep 5

# 9. Health check
echo "🏥 Running health check..."
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://$VPS/health || echo "000")

if [ "$HEALTH_CHECK" = "200" ]; then
  echo "✅ Health check PASSED (HTTP $HEALTH_CHECK)"
else
  echo "⚠️  Health check returned HTTP $HEALTH_CHECK (may take a few seconds)"
fi

echo ""
echo "========================================"
echo "✅ DEPLOY COMPLETE!"
echo "========================================"
echo ""
echo "📍 API URL: http://$VPS"
echo "📍 Health: http://$VPS/health"
echo "📍 Leads API: http://$VPS/api/leads"
echo "📍 Webhook: http://$VPS/evolution/webhook"
echo ""
echo "Next steps:"
echo "1. Update EVOLUTION_API_URL and EVOLUTION_API_KEY in .env:"
echo "   ssh root@$VPS"
echo "   nano /opt/$PROJECT/.env"
echo ""
echo "2. Restart containers after changing .env:"
echo "   ssh root@$VPS"
echo "   cd /opt/$PROJECT && docker-compose restart"
echo ""
echo "3. View logs:"
echo "   ssh root@$VPS"
echo "   docker logs -f whatsapp-crm-swarm_app"
echo ""
echo "📄 Log file saved to: $DEPLOY_DIR/deploy-log.txt"
ssh root@$VPS "echo 'Deployed $(date)' >> $DEPLOY_DIR/deploy-log.txt"

# Cleanup
rm -f /tmp/whatsapp-src.tar.gz

echo ""
echo "✨ Deploy ready! Configure .env and you're good to go."
