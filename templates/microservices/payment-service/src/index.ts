import 'dotenv/config';
import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import amqp from 'amqplib';
import { z } from 'zod';

const PORT = parseInt(process.env.PORT ?? '4002', 10);

if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is required');
if (!process.env.STRIPE_WEBHOOK_SECRET) throw new Error('STRIPE_WEBHOOK_SECRET is required');
if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required');
if (!process.env.RABBITMQ_URL) throw new Error('RABBITMQ_URL is required');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16', typescript: true });
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

// ─── RabbitMQ Publisher ───────────────────────────────────────────────────────

let rabbitChannel: amqp.Channel | null = null;

async function connectRabbitMQ(retries = 5): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const connection = await amqp.connect(process.env.RABBITMQ_URL!);
      rabbitChannel = await connection.createChannel();
      await rabbitChannel.assertQueue('payment.events', { durable: true });
      fastify.log.info('RabbitMQ connection established');
      return;
    } catch (err) {
      fastify.log.warn({ attempt, err }, 'RabbitMQ connection failed, retrying...');
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 3000 * attempt));
    }
  }
}

function publishPaymentEvent(event: Record<string, unknown>): void {
  if (!rabbitChannel) {
    fastify.log.error('RabbitMQ channel not available, dropping event');
    return;
  }
  rabbitChannel.sendToQueue(
    'payment.events',
    Buffer.from(JSON.stringify(event)),
    { persistent: true, contentType: 'application/json' }
  );
}

// ─── Validation Schemas ───────────────────────────────────────────────────────

const CheckoutSchema = z.object({
  priceId: z.string().min(1),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  customerId: z.string().optional(),
});

// ─── Auth Guard ───────────────────────────────────────────────────────────────

async function requireAuth(request: Parameters<typeof fastify.get>[1] extends (req: infer R, ...args: unknown[]) => unknown ? R : never, reply: Parameters<typeof fastify.get>[1] extends (req: unknown, rep: infer R, ...args: unknown[]) => unknown ? R : never) {
  try {
    await request.jwtVerify();
  } catch {
    reply.code(401).send({ error: 'Unauthorized' });
  }
}

// ─── Routes ───────────────────────────────────────────────────────────────────

fastify.post('/checkout/session', { preHandler: [requireAuth] }, async (request, reply) => {
  const result = CheckoutSchema.safeParse(request.body);
  if (!result.success) {
    return reply.code(400).send({ error: 'Validation failed', details: result.error.flatten() });
  }

  const jwtPayload = request.user as { id: string; email: string };
  const { priceId, successUrl, cancelUrl } = result.data;

  // Get or create a Stripe customer for this user
  let subscription = await prisma.subscription.findFirst({
    where: { userId: jwtPayload.id },
  });

  let stripeCustomerId: string;
  if (subscription?.stripeCustomerId) {
    stripeCustomerId = subscription.stripeCustomerId;
  } else {
    const customer = await stripe.customers.create({
      email: jwtPayload.email,
      metadata: { userId: jwtPayload.id },
    });
    stripeCustomerId = customer.id;
  }

  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    client_reference_id: jwtPayload.id,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
  });

  return reply.send({ url: session.url, sessionId: session.id });
});

fastify.get('/subscriptions/:userId', { preHandler: [requireAuth] }, async (request, reply) => {
  const { userId } = request.params as { userId: string };
  const jwtPayload = request.user as { id: string };

  if (jwtPayload.id !== userId) {
    return reply.code(403).send({ error: 'Forbidden' });
  }

  const subscription = await prisma.subscription.findFirst({
    where: { userId },
  });

  if (!subscription) {
    return reply.code(404).send({ error: 'No subscription found for this user' });
  }

  return reply.send(subscription);
});

// Stripe Webhook — raw body needed for signature verification
fastify.post(
  '/webhook',
  {
    config: { rawBody: true },
  },
  async (request, reply) => {
    const signature = request.headers['stripe-signature'] as string;
    if (!signature) {
      return reply.code(400).send({ error: 'Missing stripe-signature header' });
    }

    const rawBody = (request.body as Buffer).toString();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err) {
      fastify.log.error({ err }, 'Webhook signature verification failed');
      return reply.code(400).send({ error: 'Webhook signature verification failed' });
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          const subscriptionId = session.subscription as string;
          const customerId = session.customer as string;
          const userId = session.client_reference_id!;

          const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);

          await prisma.subscription.upsert({
            where: { stripeCustomerId: customerId },
            create: {
              userId,
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              status: stripeSubscription.status,
              currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
            },
            update: {
              stripeSubscriptionId: subscriptionId,
              status: stripeSubscription.status,
              currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
            },
          });

          // Emit event for core-service to activate subscription
          publishPaymentEvent({
            type: 'payment.completed',
            userId,
            customerId,
            subscriptionId,
            plan: 'PRO',
            timestamp: new Date().toISOString(),
          });

          break;
        }

        case 'customer.subscription.updated': {
          const sub = event.data.object as Stripe.Subscription;
          await prisma.subscription.updateMany({
            where: { stripeCustomerId: sub.customer as string },
            data: {
              status: sub.status,
              currentPeriodEnd: new Date(sub.current_period_end * 1000),
            },
          });
          break;
        }

        case 'customer.subscription.deleted': {
          const sub = event.data.object as Stripe.Subscription;
          await prisma.subscription.updateMany({
            where: { stripeCustomerId: sub.customer as string },
            data: { status: 'canceled', stripeSubscriptionId: null },
          });

          const subscription = await prisma.subscription.findFirst({
            where: { stripeCustomerId: sub.customer as string },
          });

          if (subscription) {
            publishPaymentEvent({
              type: 'payment.canceled',
              userId: subscription.userId,
              customerId: sub.customer as string,
              timestamp: new Date().toISOString(),
            });
          }
          break;
        }
      }

      return reply.code(200).send({ received: true });
    } catch (err) {
      fastify.log.error({ err, eventType: event.type }, 'Webhook handler error');
      return reply.code(500).send({ error: 'Webhook handler failed' });
    }
  }
);

// ─── Health ───────────────────────────────────────────────────────────────────

fastify.get('/health', async () => ({
  status: 'ok',
  service: 'payment-service',
  timestamp: new Date().toISOString(),
}));

// ─── Start ────────────────────────────────────────────────────────────────────

await connectRabbitMQ();

try {
  await fastify.listen({ port: PORT, host: '0.0.0.0' });
  fastify.log.info(`Payment service running on port ${PORT}`);
} catch (err) {
  fastify.log.error(err);
  await prisma.$disconnect();
  process.exit(1);
}

process.on('SIGTERM', async () => {
  await fastify.close();
  await prisma.$disconnect();
  process.exit(0);
});
