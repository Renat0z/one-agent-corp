import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import * as amqplib from 'amqplib';
import 'dotenv/config';

const fastify = Fastify({ logger: true });

// eslint-disable-next-line @typescript-eslint/no-floating-promises
fastify.register(helmet);

const PORT = parseInt(process.env['PORT'] ?? '4003', 10);
const RABBITMQ_URL = process.env['RABBITMQ_URL'] ?? 'amqp://rabbitmq:5672';

interface Item {
  id: string;
  name: string;
  data: Record<string, unknown>;
  createdAt: string;
}

const items = new Map<string, Item>();

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', service: 'core-service', timestamp: new Date().toISOString() };
});

// CRUD routes for core resource
fastify.get('/items', async () => {
  return { items: Array.from(items.values()) };
});

fastify.get<{ Params: { id: string } }>('/items/:id', async (request, reply) => {
  const item = items.get(request.params.id);
  if (!item) return reply.status(404).send({ error: 'Item not found' });
  return item;
});

fastify.post<{ Body: { name: string; data?: Record<string, unknown> } }>(
  '/items',
  async (request, reply) => {
    const { name, data = {} } = request.body;
    if (!name) return reply.status(400).send({ error: 'name is required' });
    const item: Item = {
      id: `item-${Date.now()}`,
      name,
      data,
      createdAt: new Date().toISOString(),
    };
    items.set(item.id, item);
    return reply.status(201).send(item);
  },
);

fastify.delete<{ Params: { id: string } }>('/items/:id', async (request, reply) => {
  if (!items.delete(request.params.id)) {
    return reply.status(404).send({ error: 'Item not found' });
  }
  return { success: true };
});

// RabbitMQ consumer — listen to payment.completed events
async function startConsumer(): Promise<void> {
  try {
    const connection = await amqplib.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    const queue = 'payment.completed';
    await channel.assertQueue(queue, { durable: true });

    fastify.log.info(`Listening for events on queue: ${queue}`);

    await channel.consume(queue, (msg) => {
      if (!msg) return;
      try {
        const event = JSON.parse(msg.content.toString()) as { userId: string; subscriptionId: string };
        fastify.log.info(`Payment completed for user ${event.userId} — activating subscription`);
        // TODO: Update user subscription status in DB
        channel.ack(msg);
      } catch (err) {
        fastify.log.error('Failed to process payment event:', err);
        channel.nack(msg, false, false);
      }
    });
  } catch (err) {
    fastify.log.warn('RabbitMQ not available, skipping consumer setup:', err);
  }
}

const start = async (): Promise<void> => {
  await startConsumer();
  await fastify.listen({ port: PORT, host: '0.0.0.0' });
};

start().catch((err) => {
  fastify.log.error(err);
  process.exit(1);
});
