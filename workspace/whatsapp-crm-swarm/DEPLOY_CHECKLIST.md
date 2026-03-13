# ✅ DEPLOY CHECKLIST — whatsapp-crm-swarm

## STATUS ATUAL
- ✅ **Código-fonte compilado** (TypeScript → JavaScript)
- ✅ **Docker + docker-compose configurado**
- ✅ **Nginx proxy pronto**
- ✅ **Deploy script existe**
- ⚠️ **VPS target existe mas não validado** (89.167.83.218)

---

## 🚨 BLOQUEADORES RESOLVIDOS

### ✅ 1. TypeScript Configuration (RESOLVIDO)
- Criado `tsconfig.json` com ES2020 target
- Compilação bem-sucedida com `npm run build`
- Output em `dist/`

### ✅ 2. Dependências npm (RESOLVIDO)
```bash
npm install
npm install node-cron --save
```
- 207 pacotes instalados
- Sem vulnerabilidades
- better-sqlite3 compilado com sucesso

### ✅ 3. Erros de Código (RESOLVIDO)
- Corrigido: `checks.ts` — usar `Queries` em vez de `LeadRepository`
- Corrigido: `scheduler.ts` — import named export `{ db }` em vez de default
- Corrigido: Type annotations faltantes em rotas Express
- Corrigido: Schema.ts Database type annotation

---

## ⚠️ PENDÊNCIAS PRÉ-DEPLOY

### 1. **Health Check Endpoint**
**Status**: ❌ Não existe  
**Crítico para**: Docker/Nginx liveness probe  
**Solução**:
```typescript
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
```

### 2. **.env Variables (VPS)**
**Status**: ⚠️ Template existe, valores reais faltam  
**Necessários**:
```
PORT=3000
DB_PATH=/data/crm.db
NODE_ENV=production
EVOLUTION_API_URL=https://seu-evolution-api.com
EVOLUTION_API_KEY=sua_chave_aqui_32_caracteres
```
**Ação**: Configurar valores reais no VPS antes do deploy

### 3. **Docker Image Build Test**
**Status**: ❌ Não testado localmente  
**Solução**:
```bash
cd ./workspace/whatsapp-crm-swarm/src
docker build -t whatsapp-crm-swarm:latest .
docker run -p 3000:3000 -e PORT=3000 whatsapp-crm-swarm:latest
```

### 4. **Volume/Data Persistence**
**Status**: ⚠️ Configurado em docker-compose  
**Verificar**:
- Pasta `./src/data/` existe no VPS
- Permissões corretas para escrita
- Backup strategy para `crm.db`

### 5. **Webhook URL Configuration**
**Status**: ⚠️ Route existe mas URL não validada  
**Necessário**:
```
Evolution API deve apontar para:
https://89.167.83.218/evolution/webhook
```
**Ação**: Configurar callback na Evolution API

### 6. **SSL/HTTPS (Production)**
**Status**: ❌ Nginx com HTTP apenas  
**Solução** (após deploy inicial):
```bash
# No VPS, instalar Certbot
apt-get update && apt-get install certbot python3-certbot-nginx
certbot certonly --standalone -d seu-dominio.com
# Atualizar nginx.conf com certificados
```

### 7. **Logging & Monitoring**
**Status**: ❌ Sem estrutura  
**Melhorias sugeridas**:
- Docker logs: `docker logs whatsapp-crm-swarm_app_1`
- Log rotation: adicionar ao docker-compose
- Healthcheck em docker-compose

### 8. **Backup Strategy**
**Status**: ❌ Não existe  
**Recomendado**:
```bash
# Cron job no VPS
0 2 * * * docker exec whatsapp-crm-swarm_app_1 \
  cp /app/data/crm.db /backups/crm_$(date +\%Y\%m\%d).db
```

---

## 🚀 SEQUÊNCIA DE DEPLOY

### Pré-Deploy (Local)
```bash
# 1. Compilar
cd ./workspace/whatsapp-crm-swarm/src
npm run build

# 2. Testar Docker localmente (opcional)
docker build -t whatsapp-crm-swarm:test .
docker-compose -f docker-compose.yml up --build

# 3. Verificar saúde
curl http://localhost/health
```

### Deploy (VPS)
```bash
# 1. SSH no VPS
ssh root@89.167.83.218

# 2. Preparar estrutura
mkdir -p /opt/whatsapp-crm-swarm/data
cd /opt/whatsapp-crm-swarm

# 3. Copiar arquivos (executar do local)
cd ./workspace/whatsapp-crm-swarm
bash deploy/deploy.sh

# 4. Validar
curl http://89.167.83.218/health
curl http://89.167.83.218/api/leads
```

---

## ✨ ADIÇÕES RECOMENDADAS PRÉ-LAUNCH

### `src/server.ts` — adicionar antes do listen:
```typescript
// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: Function) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});
```

### `docker-compose.yml` — adicionar healthcheck:
```yaml
app:
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 40s
```

### `deploy/deploy.sh` — adicionar validação:
```bash
# Validar saúde após deploy
sleep 5
if curl -f http://$VPS/health > /dev/null; then
  echo "✅ Health check PASSED"
else
  echo "❌ Health check FAILED - rollback recomendado"
  bash rollback.sh
  exit 1
fi
```

---

## 📊 ROADMAP PÓS-DEPLOY

| Prioridade | Tarefa | Timeline |
|:---|:---|:---|
| 🔴 Crítico | Monitorar logs VPS | Contínuo |
| 🔴 Crítico | Testar webhooks Evolution | 1h após deploy |
| 🟡 Alto | SSL/HTTPS com Certbot | Dia 1 |
| 🟡 Alto | Backup automation | Dia 2 |
| 🟢 Normal | CloudFlare CDN (opcional) | Semana 1 |
| 🟢 Normal | PM2/Systemd para auto-restart | Semana 1 |

---

## 🎯 GO/NO-GO DECISION

**GO** quando:
- ✅ `npm run build` executa sem erros
- ✅ `docker build` bem-sucedido
- ✅ `.env` preenchido no VPS
- ✅ Health endpoint responde 200
- ✅ Webhook URL configurada na Evolution API

**NO-GO** se:
- ❌ Compilação falha
- ❌ Docker build time > 5 min
- ❌ Banco de dados não persiste
- ❌ Webhook retorna erro

