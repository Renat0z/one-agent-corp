import 'dotenv/config';
import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const PORT = parseInt(process.env.PORT ?? '4001', 10);
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS ?? '12', 10);

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

const prisma = new PrismaClient();
const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL ?? 'info',
    transport:
      process.env.NODE_ENV !== 'production'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
  },
});

await fastify.register(helmet);
await fastify.register(jwt, { secret: process.env.JWT_SECRET });

// ─── Validation Schemas ───────────────────────────────────────────────────────

const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

const UpdateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
});

// ─── Auth Guard ───────────────────────────────────────────────────────────────

async function requireAuth(request: Parameters<typeof fastify.get>[1] extends (req: infer R, ...args: unknown[]) => unknown ? R : never, reply: Parameters<typeof fastify.get>[1] extends (req: unknown, rep: infer R, ...args: unknown[]) => unknown ? R : never) {
  try {
    await request.jwtVerify();
  } catch {
    reply.code(401).send({ error: 'Unauthorized' });
  }
}

// ─── Auth Routes ──────────────────────────────────────────────────────────────

fastify.post('/auth/register', async (request, reply) => {
  const result = RegisterSchema.safeParse(request.body);
  if (!result.success) {
    return reply.code(400).send({ error: 'Validation failed', details: result.error.flatten() });
  }

  const { email, password, name } = result.data;

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return reply.code(409).send({ error: 'A user with this email already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
    },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  const token = fastify.jwt.sign(
    { id: user.id, email: user.email },
    { expiresIn: '7d' }
  );

  return reply.code(201).send({ user, token });
});

fastify.post('/auth/login', async (request, reply) => {
  const result = LoginSchema.safeParse(request.body);
  if (!result.success) {
    return reply.code(400).send({ error: 'Validation failed', details: result.error.flatten() });
  }

  const { email, password } = result.data;

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    return reply.code(401).send({ error: 'Invalid email or password' });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return reply.code(401).send({ error: 'Invalid email or password' });
  }

  const token = fastify.jwt.sign(
    { id: user.id, email: user.email },
    { expiresIn: '7d' }
  );

  return reply.send({
    user: { id: user.id, email: user.email, name: user.name },
    token,
  });
});

// ─── User CRUD Routes ─────────────────────────────────────────────────────────

fastify.get('/users/:id', { preHandler: [requireAuth] }, async (request, reply) => {
  const { id } = request.params as { id: string };

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, createdAt: true, updatedAt: true },
  });

  if (!user) {
    return reply.code(404).send({ error: 'User not found' });
  }

  return reply.send(user);
});

fastify.put('/users/:id', { preHandler: [requireAuth] }, async (request, reply) => {
  const { id } = request.params as { id: string };
  const result = UpdateUserSchema.safeParse(request.body);

  if (!result.success) {
    return reply.code(400).send({ error: 'Validation failed', details: result.error.flatten() });
  }

  // Only the user themselves can update their profile
  const jwtPayload = request.user as { id: string };
  if (jwtPayload.id !== id) {
    return reply.code(403).send({ error: 'Forbidden' });
  }

  const updateData: Record<string, string> = {};
  if (result.data.name) updateData.name = result.data.name;
  if (result.data.email) updateData.email = result.data.email.toLowerCase();

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: { id: true, email: true, name: true, updatedAt: true },
  });

  return reply.send(user);
});

fastify.delete('/users/:id', { preHandler: [requireAuth] }, async (request, reply) => {
  const { id } = request.params as { id: string };
  const jwtPayload = request.user as { id: string };

  if (jwtPayload.id !== id) {
    return reply.code(403).send({ error: 'Forbidden' });
  }

  await prisma.user.delete({ where: { id } });
  return reply.code(204).send();
});

// ─── Health ───────────────────────────────────────────────────────────────────

fastify.get('/health', async () => ({
  status: 'ok',
  service: 'user-service',
  timestamp: new Date().toISOString(),
}));

// ─── Start ────────────────────────────────────────────────────────────────────

try {
  await fastify.listen({ port: PORT, host: '0.0.0.0' });
  fastify.log.info(`User service running on port ${PORT}`);
} catch (err) {
  fastify.log.error(err);
  await prisma.$disconnect();
  process.exit(1);
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  await fastify.close();
  await prisma.$disconnect();
  process.exit(0);
});
