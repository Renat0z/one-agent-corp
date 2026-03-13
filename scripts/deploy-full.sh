#!/bin/bash
# Deploy Completo - ProfitBridge AI (Frontend + Backend)

echo "🚚 Enviando arquivos fontes para a VPS..."

# Compactar Frontend
cd projects/profitbridge-ai/frontend
tar -czf frontend.tar.gz .
scp frontend.tar.gz root@89.167.83.218:/root/
rm frontend.tar.gz

# Compactar Backend
cd ../core
tar -czf core.tar.gz .
scp core.tar.gz root@89.167.83.218:/root/
rm core.tar.gz

echo "🛠️  Iniciando Build Remoto na VPS..."
ssh root@89.167.83.218 << 'EOF'
  # 1. Setup Frontend
  mkdir -p /root/profitbridge-frontend
  tar -xzf /root/frontend.tar.gz -C /root/profitbridge-frontend
  cd /root/profitbridge-frontend
  docker build -t profitbridge-roi .
  docker stop roi-calculator || true
  docker rm roi-calculator || true
  docker run -d -p 3030:80 --name roi-calculator profitbridge-roi

  # 2. Setup Backend
  mkdir -p /root/profitbridge-core
  tar -xzf /root/core.tar.gz -C /root/profitbridge-core
  cd /root/profitbridge-core
  docker build -t profitbridge-backend .
  docker stop pb-backend || true
  docker rm pb-backend || true
  docker run -d -p 4040:4040 --name pb-backend profitbridge-backend

  # Limpeza
  rm /root/frontend.tar.gz
  rm /root/core.tar.gz
  
  echo "✅ Tudo no ar!"
  echo "Calculadora: http://89.167.83.218:3030"
  echo "API: http://89.167.83.218:4040"
EOF
