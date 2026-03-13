#!/bin/bash
# Script de Deploy - Imã Digital (ProfitBridge ROI Calculator)

echo "🚀 Iniciando Build Local do Frontend..."
cd projects/profitbridge-ai/frontend

# Build Docker
docker build -t profitbridge-roi .

echo "📦 Exportando imagem..."
docker save profitbridge-roi | gzip > roi.tar.gz

echo "🚚 Enviando para a VPS (89.167.83.218)..."
# Usando as credenciais do seu .env via scp
scp roi.tar.gz root@89.167.83.218:/root/

echo "🛠️  Instalando na VPS..."
ssh root@89.167.83.218 << 'EOF'
  # Parar container antigo se existir
  docker stop roi-calculator || true
  docker rm roi-calculator || true
  
  # Carregar nova imagem
  docker load < /root/roi.tar.gz
  
  # Rodar novo container na porta 3030 (visto que 8080 está ocupada pela Evolution API)
  docker run -d -p 3030:80 --name roi-calculator profitbridge-roi
  
  echo "✅ Sucesso! Calculadora rodando na porta 3030."
  echo "Acesse: http://89.167.83.218:3030"
EOF

# Limpeza local
rm roi.tar.gz
