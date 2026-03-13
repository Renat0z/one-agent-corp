```typescript
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'node:crypto';
import {
  getUserByApiKey,
  getChecks,
  getCheckById,
  createCheck,
  updateCheck,
  deleteCheck,
  getCheckCount,
  getCheckResults,
  getAlerts,
} from '../db/queries.js';
import { registerCheck, unregisterCheck, runCheckNow } from '../scheduler.js';
import type { User, Check } from '../types/index.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: User;
  }
}

async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const auth = request.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Missing Authorization header. Format: Bearer <api_key>' });
  }
  const user = getUserByApiKey(auth.slice(7).trim());
  if (!user) return reply.status(401).send({ error: 'Invalid API key' });
  request.user = user;
}

function isValidUrl(url: string): boolean {
  try {
    const { protocol } = new URL(url);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

export async function checkRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('onRequest', authenticate);

  // ── POST /api/checks ───────────────────────────────────────────────────────
  app.post<{
    Body: { url: string; name: string; interval_seconds?: number; timeout_ms?: number };
  }>(
    '/checks',
    {
      schema: {
        body: {
          type: 'object',
          required: ['url', 'name'],
          properties: {
            url:              { type: 'string', maxLength: 2048 },
            name:             { type: 'string', minLength: 1, maxLength: 255 },
            interval_seconds: { type: 'integer', minimum: 30, maximum: 3600 },
            timeout_ms:       { type: 'integer', minimum: 1000, maximum: 30000 },
          },
        },
      },
    },
    async (request, reply) => {
      const user = request.user!;
      const { url, name, interval_seconds = 60, timeout_ms = 5000 } = request.body;

      if (!isValidUrl(url)) {
        return reply.status(400).send({ error: 'Invalid URL. Must start with http:// or https://' });
      }

      const count = getCheckCount(user.id);
      if (count >= user.checks_limit) {
        return reply.status(403).send({
          error: `Plan limit reached. Your "${user.plan}" plan allows ${user.checks_limit} check(s).`,
        });
      }

      const check: Check = {
        id: randomUUID(),
        user_id: user.id,
        url,
        name,
        interval_seconds,
        timeout_ms,
        status: 'unknown',
        consecutive_failures: 0,
        last_checked_at: null,
        last_status_change_at: null,
        created_at: Math.floor(Date.now() / 1000),
      };

      const created = createCheck(check);
      registerCheck(created);
      return reply.status(201).send(created);
    },
  );

  // ── GET /api/checks ────────────────────────────────────────────────────────
  app.get('/checks', async (request, reply) => {
    const checks = getChecks(request.user!.id);
    return reply.send({ data: checks, count: checks.length });
  });

  // ── GET /api/checks/:id ────────────────────────────────────────────────────
  app.get<{ Params: { id: string } }>('/checks/:id', async (request, reply) => {
    const check = getCheckById(request.params.id);
    if (!check || check.user_id !== request.user!.id) {
      return reply.status(404).send({ error: 'Check not found' });
    }

    const results = getCheckResults(check.id, 48);
    const alerts  = getAlerts(check.id, 20);
    const uptime  = results.length
      ? Math.round((results.filter(r => r.is_up === 1).length / results.length) * 1000) / 10
      : null;

    return reply.send({ ...check, uptime_percent: uptime, results, alerts });
  });

  // ── PATCH /api/checks/:id ──────────────────────────────────────────────────
  app.patch<{
    Params: { id: string };
    Body: { name?: string; interval_seconds?: number; timeout_ms?: number };
  }>(
    '/checks/:id',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            name:             { type: 'string', minLength: 1, maxLength: 255 },
            interval_seconds: { type: 'integer', minimum: 30, maximum: 3600 },
            timeout_ms:       { type: 'integer', minimum: 1000, maximum: 30000 },
          },
        },
      },
    },
    async (request, reply) => {
      const check = getCheckById(request.params.id);
      if (!check || check.user_id !== request.user!.id) {
        return reply.status(404).send({ error: 'Check not found' });
      }

      const updated = updateCheck(check.id, request.body);

      if (request.body.interval_seconds !== undefined) {
        unregisterCheck(check.id);
        registerCheck(updated);
      }

      return reply.send(updated);
    },
  );

  // ── DELETE /api/checks/:id ─────────────────────────────────────────────────
  app.delete<{ Params: { id: string } }>('/checks/:id', async (request, reply) => {
    const check = getCheckById(request.params.id);
    if (!check || check.user_id !== request.user!.id) {
      return reply.status(404).send({ error: 'Check not found' });
    }
    unregisterCheck(check.id);
    deleteCheck(check.id);
    return reply.status(204).send();
  });

  // ── POST /api/checks/:id/run ───────────────────────────────────────────────
  app.post<{ Params: { id: string } }>('/checks/:id/run', async (request, reply) => {
    const check = getCheckById(request.params.id);
    if (!check || check.user_id !== request.user!.id) {
      return reply.status(404).send({ error: 'Check not found' });
    }
    const result = await runCheckNow(check.id);
    return reply.send(result);
  });
}
```