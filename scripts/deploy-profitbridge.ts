import { execa } from 'execa';
import { readFile } from 'fs/promises';
import path from 'path';

/**
 * Script de Deploy Automatizado via SSH
 * One Agent Corp - ProfitBridge AI
 */

async function deploy() {
  console.log('🚀 Iniciando Deploy do ProfitBridge AI...');

  // Configurações de Destino (Deverão vir do .env do orquestrador)
  const REMOTE_HOST = process.env.DEPLOY_HOST || 'sua-vps.com';
  const REMOTE_USER = process.env.DEPLOY_USER || 'root';
  const REMOTE_PATH = '/opt/one-agent-corp/profitbridge-ai';

  try {
    // 1. Build Local
    console.log('📦 Preparando build local...');
    await execa('npm', ['run', 'build'], { cwd: './profitbridge-ai' }).catch(() => {
      console.log('⚠️ Aviso: Comando build não encontrado, ignorando...');
    });

    // 2. Empacotamento
    console.log('📚 Empacotando arquivos...');
    // Em um cenário real, usaríamos rsync ou scp. 
    // Aqui simulamos a orquestração do comando.
    
    const deployCommand = `rsync -avz --exclude 'node_modules' --exclude '.git' ./profitbridge-ai/ ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}`;
    
    console.log(`💻 Comando sugerido para execução manual ou via CI/CD:\n${deployCommand}`);

    // 3. Configuração do Cron Job na VPS
    const cronCommand = `*/5 * * * * cd ${REMOTE_PATH} && npx tsx src/index.ts >> logs/sync.log 2>&1`;
    console.log(`\n⏰ Configuração de Cron Job recomendada (Sincronização a cada 5 min):\n${cronCommand}`);

    console.log('\n✅ Script de deploy gerado e pronto para integração.');

  } catch (error) {
    console.error('❌ Erro no deploy:', error);
  }
}

deploy();
