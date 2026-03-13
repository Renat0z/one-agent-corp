# ProfitBridge AI - Deploy Automático

Este script prepara e envia o Imã Digital (Calculadora ROI) para a VPS.

## 1. Local Build & Push
O script deve ser executado no root do projeto:

```bash
# Entrar na pasta do frontend
cd projects/profitbridge-ai/frontend

# Build da imagem Docker
docker build -t profitbridge-roi .

# Exportar imagem para arquivo
docker save profitbridge-roi | gzip > profitbridge-roi.tar.gz

# Enviar para a VPS (Usando as credenciais do .env)
# Host: 89.167.83.218
scp profitbridge-roi.tar.gz root@89.167.83.218:/root/

# No servidor (SSH):
# docker load < profitbridge-roi.tar.gz
# docker run -d -p 80:80 --name roi-calculator profitbridge-roi
```

## 2. Deploy via GitHub Actions (Recomendado)
Para automatizar, vamos criar um workflow que detecta push na pasta `frontend` e faz o deploy via SSH.
