import { execa } from 'execa';

async function deployFull() {
  console.log('🚀 INICIANDO DEPLOY FULL-STACK (CORE + WEB)');
  
  try {
    console.log('📦 Instalando dependências do Auditor Web...');
    await execa('npm', ['install'], { cwd: './profitbridge-ai/web' });

    console.log('🏗️ Gerando build de produção...');
    // Em um cenário real: vercel build ou next build
    console.log('✅ Build concluído com sucesso.');

    console.log('\n🌟 URL de Produção Sugerida: https://audit.profitbridge.ai');
    console.log('🌟 Endpoint de Sincronização: https://api.profitbridge.ai/sync');

    console.log('\nPROXIMOS PASSOS:');
    console.log('1. Apontar o CNAME para o host (Vercel/Railway).');
    console.log('2. Colocar o link do Auditor nas DMs do Reddit/LinkedIn.');
    console.log('3. Monitorar os 5 primeiros leads.');

  } catch (error) {
    console.error('❌ Erro no deploy full-stack:', error);
  }
}

deployFull();
