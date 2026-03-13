import 'dotenv/config';
import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { request as undiciRequest } from 'undici';

const PORT = parseInt(process.env.PORT ?? '4000', 10);
const USER_SERVICE_URL = process.env.USER_SERVICE_URL ?? 'http://user-service:4001';
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL ?? 'http://payment-service:4002';
const CORE_SERVICE_URL = process.env.CORE_SERVICE_URL ?? 'http://core-service:4003';
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000';
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX ?? '100', 10);
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '60000', 10);

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL ?? 'info',
    transport:
      process.env.NODE_ENV !== 'production'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
  },
});

// ─── Plugins ─────────────────────────────────────────────────────────────────

await fastify.register(helmet, {
  contentSecurityPolicy: false, // CSP managed by frontend
});

await fastify.register(cors, {
  origin: FRONTEND_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});

await fastify.register(rateLimit, {
  max: RATE_LIMIT_MAX,
  timeWindow: RATE_LIMIT_WINDOW_MS,
  keyGenerator: (req) =>
    (req.headers['x-forwarded-for'] as string) ?? req.ip ?? 'unknown',
  errorResponseBuilder: (_req, context) => ({
    error: 'Too Many Requests',
    message: `Rate limit exceeded. Try again in ${Math.ceil(context.ttl / 1000)} seconds.`,
    statusCode: 429,
  }),
});

await fastify.register(jwt, {
  secret: process.env.JWT_SECRET,
});

// ─── Auth Middleware ──────────────────────────────────────────────────────────

const PUBLIC_ROUTE_PREFIXES = [
  '/health',
  '/api/users/auth/',
  '/api/payments/webhook',
];

function isPublicRoute(url: string): boolean {
  return PUBLIC_ROUTE_PREFIXES.some((prefix) => url.startsWith(prefix));
}

fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
  if (isPublicRoute(request.url)) return;

  try {
    await request.jwtVerify();
  } catch {
    reply.code(401).send({ error: 'Unauthorized', message: 'A valid JWT token is required' });
  }
});

// ─── Proxy Helper ─────────────────────────────────────────────────────────────

async function proxyRequest(
  request: FastifyRequest,
  reply: FastifyReply,
  targetUrl: string
): Promise<void> {
  const headers: Record<string, string> = {
    'content-type': (request.headers['content-type'] as string) ?? 'application/json',
    'x-request-id': (request.headers['x-request-id'] as string) ?? crypto.randomUUID(),
    'x-forwarded-for': request.ip,
  };

  // Forward authenticated user info downstream
  if ((request as FastifyRequest & { user?: Record<string, unknown> }).user) {
    headers['x-user-id'] = String(
      (request as FastifyRequest & { user?: Record<string, unknown> }).user?.id ?? ''
    );
  }

  try {
    const body =
      request.method !== 'GET' && request.method !== 'HEAD'
        ? JSON.stringify(request.body)
        : undefined;

    const { statusCode, headers: resHeaders, body: resBody } = await undiciRequest(targetUrl, {
      method: request.method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
      headers,
      body,
    });

    const responseData = await resBody.json();
    const contentType = resHeaders['content-type'] as string | undefined;

    reply
      .code(statusCode)
      .header('content-type', contentType ?? 'application/json')
      .send(responseData);
  } catch (err) {
    request.log.error({ err, targetUrl }, 'Proxy request failed');
    reply.code(502).send({ error: 'Bad Gateway', message: 'Upstream service unavailable' });
  }
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// Health check
fastify.get('/health', async (_request, _reply) => ({
  status: 'ok',
  timestamp: new Date().toISOString(),
  services: {
    user: USER_SERVICE_URL,
    payment: PAYMENT_SERVICE_URL,
    core: CORE_SERVICE_URL,
  },
}));

// Proxy: /api/users/* → user-service
fastify.all('/api/users/*', async (request, reply) => {
  const path = request.url.replace('/api/users', '');
  await proxyRequest(request, reply, `${USER_SERVICE_URL}${path}`);
});

// Proxy: /api/payments/* → payment-service
fastify.all('/api/payments/*', async (request, reply) => {
  const path = request.url.replace('/api/payments', '');
  await proxyRequest(request, reply, `${PAYMENT_SERVICE_URL}${path}`);
});

// Proxy: /api/core/* → core-service
fastify.all('/api/core/*', async (request, reply) => {
  const path = request.url.replace('/api/core', '');
  await proxyRequest(request, reply, `${CORE_SERVICE_URL}${path}`);
});

// ─── Start ────────────────────────────────────────────────────────────────────

try {
  await fastify.listen({ port: PORT, host: '0.0.0.0' });
  fastify.log.info(`API Gateway running on port ${PORT}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
