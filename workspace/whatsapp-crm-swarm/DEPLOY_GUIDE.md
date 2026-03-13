# 🚀 DEPLOY GUIDE — whatsapp-crm-swarm

## ✅ STATUS: PRONTO PARA DEPLOY

Todas as compilações passaram. Código está otimizado para produção.

---

## 📋 PRÉ-REQUISITOS

- [ ] **Local**: Node.js 20+, Docker, Docker Compose
- [ ] **VPS** (89.167.83.218): SSH acesso root, Docker instalado
- [ ] **Evolution API**: URL + API Key válidos
- [ ] **Domínio DNS**: (opcional, mas recomendado para HTTPS)

---

## 🎯 PASSO 1: COMPILAR LOCALMENTE

```bash
cd ./workspace/whatsapp-crm-swarm/src

# Build TypeScript
npm run build

# Verificar output
ls -la dist/
```

**Expected**: Pasta `dist/` com `.js` e `.js.map` files

---

## 🐳 PASSO 2: TESTAR DOCKER LOCALMENTE (OPCIONAL)

```bash
# Build image
docker build -t whatsapp-crm-swarm:local .

# Run container
docker run \
  -p 3000:3000 \
  -e PORT=3000 \
  -e EVOLUTION_API_URL=https://seu-server.com \
  -e EVOLUTION_API_KEY=sua_chave_aqui \
  -v $(pwd)/data:/app/data \
  whatsapp-crm-swarm:local

# Test health
curl http://localhost:3000/health
# Expected: {"status":"ok","timestamp":"...","version":"1.0.0"}

# Stop
docker stop <container_id>
```

---

## 📤 PASSO 3: DEPLOY PARA VPS

### Opção A: Usar script automático

```bash
# Do diretório do projeto
cd ./workspace/whatsapp-crm-swarm
bash deploy/deploy.sh
```

### Opção B: Deploy manual (mais controle)

#### 3.1 SSH no VPS
```bash
ssh root@89.167.83.218
```

#### 3.2 Preparar estrutura
```bash
mkdir -p /opt/whatsapp-crm-swarm/data
mkdir -p /opt/whatsapp-crm-swarm/logs
cd /opt/whatsapp-crm-swarm
```

#### 3.3 Copiar arquivos (do seu local)
```bash
# Execute do seu local, não do VPS
rsync -avz --delete \
  --exclude='node_modules' \
  --exclude='.env' \
  --exclude='dist' \
  /seu/caminho/whatsapp-crm-swarm/src/ \
  root@89.167.83.218:/opt/whatsapp-crm-swarm/src/

# Copiar infra files
scp /seu/caminho/whatsapp-crm-swarm/src/Dockerfile root@89.167.83.218:/opt/whatsapp-crm-swarm/
scp /seu/caminho/whatsapp-crm-swarm/src/docker-compose.yml root@89.167.83.218:/opt/whatsapp-crm-swarm/
scp /seu/caminho/whatsapp-crm-swarm/src/nginx.conf root@89.167.83.218:/opt/whatsapp-crm-swarm/
scp /seu/caminho/whatsapp-crm-swarm/src/package.json root@89.167.83.218:/opt/whatsapp-crm-swarm/
```

#### 3.4 Criar .env no VPS (via SSH)
```bash
ssh root@89.167.83.218 "cat > /opt/whatsapp-crm-swarm/.env << 'EOF'
PORT=3000
NODE_ENV=production
DB_PATH=/data/crm.db
EVOLUTION_API_URL=https://api.seuserver.com
EVOLUTION_API_KEY=sua_chave_de_32_caracteres_aqui
EOF"
```

#### 3.5 Build e start (no VPS via SSH)
```bash
ssh root@89.167.83.218 << 'EOF'
cd /opt/whatsapp-crm-swarm
docker-compose down --remove-orphans 2>/dev/null || true
docker-compose up -d --build
EOF
```

---

## ✅ PASSO 4: VALIDAR DEPLOY

### 4.1 Health Check
```bash
curl -v http://89.167.83.218/health
# Expected: 200 OK + JSON response
```

### 4.2 Ver logs
```bash
ssh root@89.167.83.218 "docker logs whatsapp-crm-swarm_app"
# Deve mostrar: "🚀 CRM Swarm running on port 3000"
```

### 4.3 Testar API
```bash
curl http://89.167.83.218/api/leads
# Expected: [] (lista vazia de leads)
```

### 4.4 Status dos containers
```bash
ssh root@89.167.83.218 "docker ps"
# Deve mostrar 2 containers: app + nginx (ambos com status "up")
```

---

## 🔐 PASSO 5: CONFIGURAR EVOLUTION API

1. Acesse seu painel Evolution API
2. Vá para **Webhooks** ou **Integrações**
3. Configure o URL:
   ```
   https://89.167.83.218/evolution/webhook
   ```
4. Método: **POST**
5. Teste o webhook

---

## 🔒 PASSO 6: SETUP SSL/HTTPS (Recomendado)

### 6.1 Instalar Certbot no VPS
```bash
ssh root@89.167.83.218 << 'EOF'
apt-get update
apt-get install -y certbot python3-certbot-nginx
EOF
```

### 6.2 Gerar certificado
```bash
ssh root@89.167.83.218 "certbot certonly --standalone -d seu-dominio.com"
```

### 6.3 Atualizar nginx.conf
```nginx
server {
    listen 80;
    server_name seu-dominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name seu-dominio.com;
    
    ssl_certificate /etc/letsencrypt/live/seu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seu-dominio.com/privkey.pem;
    
    location / {
        proxy_pass http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 📊 MONITORAMENTO PÓS-DEPLOY

### Verificar saúde periodicamente
```bash
# Adicionar cron job no seu local
0 * * * * curl -f http://89.167.83.218/health || echo "Health check failed"
```

### Ver logs em tempo real
```bash
ssh root@89.167.83.218 "docker logs -f whatsapp-crm-swarm_app"
```

### Backup do banco de dados
```bash
# Executar manualmente
ssh root@89.167.83.218 "cp /opt/whatsapp-crm-swarm/data/crm.db /opt/whatsapp-crm-swarm/data/crm_backup_$(date +%Y%m%d_%H%M%S).db"

# Ou configurar cron job no VPS
0 2 * * * cp /opt/whatsapp-crm-swarm/data/crm.db /backups/crm_$(date +\%Y\%m\%d).db
```

---

## 🆘 TROUBLESHOOTING

### ❌ "Connection refused"
```bash
# Verificar se containers estão rodando
docker ps

# Se não estiver, reconstruir
docker-compose down
docker-compose up -d --build
```

### ❌ "Port 3000 already in use"
```bash
# Parar container existente
docker stop whatsapp-crm-swarm_app

# Ou mudar porta em docker-compose.yml
# ports:
#   - "3001:3000"
```

### ❌ "Database locked"
```bash
# Remover arquivo WAL corrompido
rm /opt/whatsapp-crm-swarm/data/crm.db-wal
rm /opt/whatsapp-crm-swarm/data/crm.db-shm

# Reiniciar
docker restart whatsapp-crm-swarm_app
```

### ❌ "EVOLUTION_API_KEY is undefined"
```bash
# Verificar .env no VPS
cat /opt/whatsapp-crm-swarm/.env

# Se vazio, recriar
echo "EVOLUTION_API_KEY=sua_chave" >> /opt/whatsapp-crm-swarm/.env
docker-compose restart
```

---

## 📋 ROLLBACK (se necessário)

```bash
bash ./workspace/whatsapp-crm-swarm/deploy/rollback.sh
# Isso restaura a versão anterior do docker-compose
```

---

## 🎉 CHECKLIST FINAL

- [ ] Compilação local bem-sucedida
- [ ] Docker build bem-sucedido
- [ ] Arquivos copiados para VPS
- [ ] `.env` configurado no VPS
- [ ] Containers iniciados
- [ ] Health check responde 200
- [ ] `/api/leads` endpoint acessível
- [ ] Webhook Evolution API configurado
- [ ] SSL/HTTPS (opcional) funcionando
- [ ] Backup strategy implementada

---

## 📞 SUPORTE

- **Logs locais**: `./workspace/whatsapp-crm-swarm/src/dist/`
- **Logs VPS**: `docker logs whatsapp-crm-swarm_app`
- **SSH acesso**: `ssh root@89.167.83.218`

