#!/bin/bash
# Deploy Plano B: Build direto na VPS

echo "🚚 Enviando arquivos fontes para a VPS..."
cd projects/profitbridge-ai/frontend
tar -czf frontend.tar.gz .
scp frontend.tar.gz root@89.167.83.218:/root/

echo "🛠️  Iniciando Build Remoto na VPS..."
ssh root@89.167.83.218 << 'EOF'
  mkdir -p /root/profitbridge-frontend
  tar -xzf /root/frontend.tar.gz -C /root/profitbridge-frontend
  cd /root/profitbridge-frontend
  
  # Build Docker na VPS
  docker build -t profitbridge-roi .
  
  # Limpeza e Run
  docker stop roi-calculator || true
  docker rm roi-calculator || true
  docker run -d -p 3030:80 --name roi-calculator profitbridge-roi
  
  # Limpeza de arquivos temporários
  rm /root/frontend.tar.gz
  echo "✅ Sucesso! Calculadora rodando em http://89.167.83.218:3030"
EOF

# Limpeza local
rm frontend.tar.gz
