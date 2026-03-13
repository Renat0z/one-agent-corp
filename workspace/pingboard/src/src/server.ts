```typescript
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { getConfig } from './config.js';
import { initDb } from './db/schema.js';
import { checkRoutes } from './routes/checks.js';
import { authRoutes } from './routes/auth.js';
import { startScheduler } from './scheduler.js';

const config = getConfig();

const app = Fastify({
  logger: { level: config.NODE_ENV === 'production' ? 'info' : 'debug' },
  trustProxy: true,
});

async function bootstrap(): Promise<void> {
  await app.register(cors, {
    origin: config.NODE_ENV === 'production' ? false : '*',
  });

  await app.register(helmet, { contentSecurityPolicy: false });

  await app.register(rateLimit, {
    max: config.RATE_LIMIT_MAX_REQUESTS,
    timeWindow: config.RATE_LIMIT_WINDOW_MS,
    errorResponseBuilder: (_req, ctx) => ({
      error: 'Too many requests',
      statusCode: 429,
      retryAfter: Math.ceil(ctx.ttl / 1000),
    }),
  });

  app.get('/health', { config: { rateLimit: false } }, async () => ({
    status: 'ok',
    uptime: Math.round(process.uptime()),
    ts: Date.now(),
  }));

  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(checkRoutes, { prefix: '/api' });

  app.setErrorHandler((error, _req, reply) => {
    app.log.error({ err: error }, 'Unhandled error');
    const status = error.statusCode ?? 500;
    reply.status(status).send({
      error: status < 500 ? error.message : 'Internal server error',
      statusCode: status,
    });
  });

  initDb(config.DB_PATH);
  app.log.info('[db] SQLite ready');

  startScheduler();

  await app.listen({ port: parseInt(config.PORT), host: '0.0.0.0' });
  console.log(`🚀 Pingboard running on :${config.PORT} [${config.NODE_ENV}]`);
}

bootstrap().catch((err) => {
  console.error('❌ Fatal startup error:', err);
  process.exit(1);
});
```