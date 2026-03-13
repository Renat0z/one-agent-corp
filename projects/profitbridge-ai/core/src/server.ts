import Fastify from 'fastify';
import cors from '@fastify/cors';
import { calculateProfitLeak } from './roi_engine';

const fastify = Fastify({ logger: true });

// Configuração de CORS para permitir que o Frontend (porta 3030) acesse a API
fastify.register(cors, {
  origin: true // Em produção, podemos restringir para o IP da VPS
});

// Endpoint para capturar leads da calculadora
fastify.post('/api/leads', async (request, reply) => {
  const body = request.body as any;
  const { email, adSpend, roas, outOfStock, margin } = body;

  fastify.log.info(`Novo lead recebido: ${email}`);

  // 1. Calcular os resultados para salvar no banco
  const results = calculateProfitLeak({
    monthlyAdSpend: adSpend,
    avgRoas: roas,
    outOfStockRate: outOfStock,
    avgMargin: margin,
    softwareCost: 297
  });

  // 2. TODO: Salvar no PostgreSQL (profitbridge.calculator_leads)
  // Por enquanto, apenas logamos e retornamos sucesso
  
  return { 
    success: true, 
    message: 'Lead capturado com sucesso',
    summary: results
  };
});

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', service: 'profitbridge-core' };
});

const start = async () => {
  try {
    await fastify.listen({ port: 4040, host: '0.0.0.0' });
    console.log('🚀 Server is running on port 4040');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
