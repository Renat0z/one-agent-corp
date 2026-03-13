#!/bin/bash

# 🔍 DEPLOY VALIDATION SCRIPT
# Valida se o projeto está pronto para deploy

set +e  # Não sair em erro para mostrar todo o relatório

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC_DIR="$PROJECT_ROOT/src"

echo "🔍 VALIDANDO PROJETO WHATSAPP-CRM-SWARM"
echo "========================================"
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

# Função helper
check() {
  local name=$1
  local cmd=$2
  
  if eval "$cmd" > /dev/null 2>&1; then
    echo -e "${GREEN}✅${NC} $name"
    ((PASSED++))
  else
    echo -e "${RED}❌${NC} $name"
    ((FAILED++))
  fi
}

warn() {
  local name=$1
  echo -e "${YELLOW}⚠️${NC}  $name (não-bloqueador)"
}

# 1. Verificações de arquivo
echo "📁 ESTRUTURA DE ARQUIVOS"
echo "------------------------"
check "src/package.json existe" "test -f '$SRC_DIR/package.json'"
check "src/Dockerfile existe" "test -f '$SRC_DIR/Dockerfile'"
check "src/docker-compose.yml existe" "test -f '$SRC_DIR/docker-compose.yml'"
check "src/nginx.conf existe" "test -f '$SRC_DIR/nginx.conf'"
check "src/tsconfig.json existe" "test -f '$SRC_DIR/tsconfig.json'"
check "src/src/server.ts existe" "test -f '$SRC_DIR/src/server.ts'"
check "deploy/deploy.sh existe" "test -f '$PROJECT_ROOT/deploy/deploy.sh'"
echo ""

# 2. Verificações de dependências
echo "📦 DEPENDÊNCIAS"
echo "---------------"
if command -v node &> /dev/null; then
  NODE_VERSION=$(node --version)
  echo -e "${GREEN}✅${NC} Node.js instalado ($NODE_VERSION)"
  ((PASSED++))
else
  echo -e "${RED}❌${NC} Node.js não instalado"
  ((FAILED++))
fi

if command -v npm &> /dev/null; then
  NPM_VERSION=$(npm --version)
  echo -e "${GREEN}✅${NC} npm instalado ($NPM_VERSION)"
  ((PASSED++))
else
  echo -e "${RED}❌${NC} npm não instalado"
  ((FAILED++))
fi

if command -v docker &> /dev/null; then
  DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | tr -d ',')
  echo -e "${GREEN}✅${NC} Docker instalado ($DOCKER_VERSION)"
  ((PASSED++))
else
  echo -e "${YELLOW}⚠️${NC}  Docker não instalado (necessário para deploy)"
  ((FAILED++))
fi

if command -v docker-compose &> /dev/null; then
  COMPOSE_VERSION=$(docker-compose --version | cut -d' ' -f4 | tr -d ',')
  echo -e "${GREEN}✅${NC} Docker Compose instalado ($COMPOSE_VERSION)"
  ((PASSED++))
else
  warn "Docker Compose não instalado (necessário para deploy)"
fi

echo ""

# 3. Verificações de build
echo "🔨 COMPILAÇÃO"
echo "-------------"
cd "$SRC_DIR" || exit 1

check "node_modules existe" "test -d '$SRC_DIR/node_modules'"

# Tentar compilar
if npm run build > /tmp/build.log 2>&1; then
  echo -e "${GREEN}✅${NC} TypeScript compila sem erros"
  ((PASSED++))
else
  echo -e "${RED}❌${NC} TypeScript com erros:"
  grep "error TS" /tmp/build.log | head -3 | sed 's/^/   /'
  ((FAILED++))
fi

check "dist/ foi criado" "test -d '$SRC_DIR/dist'"
check "dist/server.js existe" "test -f '$SRC_DIR/dist/server.js'"
check "dist/db/ existe" "test -d '$SRC_DIR/dist/db'"

echo ""

# 4. Verificações de configuração
echo "⚙️  CONFIGURAÇÃO"
echo "---------------"
check ".env.example existe" "test -f '$SRC_DIR/.env.example'"
check ".env.example tem EVOLUTION_API_URL" "grep -q 'EVOLUTION_API_URL' '$SRC_DIR/.env.example'"
check ".env.example tem EVOLUTION_API_KEY" "grep -q 'EVOLUTION_API_KEY' '$SRC_DIR/.env.example'"

if [ -f "$SRC_DIR/.env" ]; then
  warn ".env já existe (será sobrescrito no deploy)"
else
  if [ ! -f "$SRC_DIR/.env.example" ]; then
    echo -e "${RED}❌${NC} .env.example não encontrado"
    ((FAILED++))
  else
    echo -e "${GREEN}✅${NC} .env não existe (será criado no VPS)"
    ((PASSED++))
  fi
fi

echo ""

# 5. Verificações de código
echo "💻 CÓDIGO"
echo "---------"
check "server.ts tem health check" "grep -q '/health' '$SRC_DIR/src/server.ts'"
check "server.ts tem error handler" "grep -q 'error:' '$SRC_DIR/src/server.ts'"
check "scheduler.ts importa db corretamente" "grep -q 'import { db }' '$SRC_DIR/src/scheduler.ts'"
check "queries.ts exporta Queries" "grep -q 'export const Queries' '$SRC_DIR/src/db/queries.ts'"

echo ""

# 6. Verificações Docker
echo "🐳 DOCKER"
echo "---------"
if command -v docker &> /dev/null; then
  # Testar se docker pode fazer build
  cd "$SRC_DIR" || exit 1
  if timeout 30 docker build -t whatsapp-crm-swarm:test . > /tmp/docker.log 2>&1; then
    echo -e "${GREEN}✅${NC} Docker image builda com sucesso"
    ((PASSED++))
    
    # Limpar imagem de teste
    docker rmi whatsapp-crm-swarm:test > /dev/null 2>&1
  else
    echo -e "${RED}❌${NC} Docker build falhou"
    tail -5 /tmp/docker.log | sed 's/^/   /'
    ((FAILED++))
  fi
else
  echo -e "${YELLOW}⚠️${NC}  Docker não disponível para teste"
fi

echo ""

# 7. Verificação de conectividade VPS (opcional)
echo "🌐 CONECTIVIDADE VPS"
echo "--------------------"
VPS_IP="89.167.83.218"

# Tentar SSH (sem output verboso)
if command -v ssh &> /dev/null; then
  if timeout 3 ssh -o StrictHostKeyChecking=no -o ConnectTimeout=2 root@"$VPS_IP" "echo ok" > /dev/null 2>&1; then
    echo -e "${GREEN}✅${NC} SSH acesso ao VPS funciona"
    ((PASSED++))
  else
    warn "SSH acesso ao VPS falhou (tente: ssh root@$VPS_IP)"
  fi
else
  warn "SSH não instalado"
fi

echo ""

# 8. Verificações de tamanho
echo "📊 TAMANHO DO PROJETO"
echo "---------------------"
if [ -d "$SRC_DIR/node_modules" ]; then
  NM_SIZE=$(du -sh "$SRC_DIR/node_modules" 2>/dev/null | cut -f1)
  echo "📦 node_modules: $NM_SIZE"
fi

if [ -d "$SRC_DIR/dist" ]; then
  DIST_SIZE=$(du -sh "$SRC_DIR/dist" 2>/dev/null | cut -f1)
  echo "📦 dist/: $DIST_SIZE"
fi

if [ -d "$SRC_DIR/src" ]; then
  SRC_SIZE=$(du -sh "$SRC_DIR/src" 2>/dev/null | cut -f1)
  echo "📦 src/ (código): $SRC_SIZE"
fi

echo ""

# Resumo final
echo "========================================"
echo "📊 RESUMO"
echo "========================================"
echo -e "${GREEN}✅ Passou:${NC} $PASSED"
echo -e "${RED}❌ Falhou:${NC} $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 PRONTO PARA DEPLOY!${NC}"
  echo ""
  echo "Próximos passos:"
  echo "1. npm run build"
  echo "2. bash deploy/deploy.sh"
  echo "3. curl http://89.167.83.218/health"
  echo ""
  exit 0
else
  echo -e "${RED}⚠️  CORREÇÕES NECESSÁRIAS${NC}"
  echo ""
  echo "Veja os erros acima e execute:"
  echo "  cd src"
  echo "  npm install"
  echo "  npm run build"
  echo ""
  exit 1
fi
