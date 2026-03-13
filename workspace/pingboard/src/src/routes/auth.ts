```typescript
import type { FastifyInstance } from 'fastify';
import { randomUUID, randomBytes, randomInt, createHash } from 'node:crypto';
import {
  getUserByWhatsapp,
  createUser,
  setUserOtp,
  clearUserOtp,
  incrementOtpAttempts,
} from '../db/queries.js';
import { sendWhatsAppAlert, buildOtpMessage } from '../services/alerter.js';
import { getConfig } from '../config.js';

function generateOtp(): string {
  // SEC-01: Using cryptographically secure random integers
  return randomInt(100_000, 999_999).toString();
}

function hashOtp(otp: string): string {
  return createHash('sha256').update(otp).digest('hex');
}

function generateApiKey(): string {
  return randomBytes(32).toString('hex');
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  return digits.startsWith('+') ? digits : `+${digits}`;
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  // POST /api/auth/register
  app.post<{ Body: { whatsapp_number: string } }>(
    '/register',
    {
      schema: {
        body: {
          type: 'object',
          required: ['whatsapp_number'],
          properties: {
            whatsapp_number: { type: 'string', minLength: 10, maxLength: 20 },
          },
        },
      },
    },
    async (request, reply) => {
      const number = normalizePhone(request.body.whatsapp_number);
      let user = getUserByWhatsapp(number);

      if (!user) {
        user = createUser({
          id: randomUUID(),
          whatsapp_number: number,
          plan: 'free',
          checks_limit: 3,
          api_key: generateApiKey(),
          otp_code: null,
          otp_expires_at: null,
        });
      }

      const otp        = generateOtp();
      const expiresAt  = Math.floor(Date.now() / 1000) + 600; // 10 min
      setUserOtp(user.id, otp, expiresAt);

      const config = getConfig();

      // Dev shortcut — return OTP directly when Evolution API is not configured
      if (!config.EVOLUTION_API_KEY || config.NODE_ENV !== 'production') {
        app.log.warn('[auth] DEV MODE — OTP returned in response (never do this in production)');
        return reply.send({
          message: 'OTP generated (dev mode — configure Evolution API for production)',
          otp,
          whatsapp_number: number,
        });
      }

      const msg  = buildOtpMessage(otp);
      const sent = await sendWhatsAppAlert(number, msg);

      if (!sent.success) {
        return reply.status(503).send({ error: 'Failed to send OTP. Please try again in a moment.' });
      }

      return reply.send({ message: 'OTP sent to your WhatsApp', whatsapp_number: number });
    },
  );

  // POST /api/auth/verify
  app.post<{ Body: { whatsapp_number: string; otp: string } }>(
    '/verify',
    {
      schema: {
        body: {
          type: 'object',
          required: ['whatsapp_number', 'otp'],
          properties: {
            whatsapp_number: { type: 'string' },
            otp: { type: 'string', minLength: 6, maxLength: 6, pattern: '^[0-9]{6}$' },
          },
        },
      },
    },
    async (request, reply) => {
      const number = normalizePhone(request.body.whatsapp_number);
      const { otp } = request.body;
      const user   = getUserByWhatsapp(number);

      if (!user) {
        return reply.status(400).send({ error: 'User not found. Call /register first.' });
      }

      const now = Math.floor(Date.now() / 1000);

      // SEC-02: Lockout after 5 attempts
      if (user.otp_attempts >= 5) {
        return reply.status(403).send({ error: 'Too many invalid attempts. Request a new OTP.' });
      }

      if (!user.otp_expires_at || user.otp_expires_at < now) {
        return reply.status(400).send({ error: 'OTP expired. Request a new one.' });
      }

      const hashedOtp = hashOtp(otp);
      if (!user.otp_code || user.otp_code !== hashedOtp) {
        const attempts = incrementOtpAttempts(user.id);
        const remaining = 5 - attempts;
        return reply.status(400).send({ 
          error: `Invalid OTP. ${remaining > 0 ? `${remaining} attempts remaining.` : 'Account locked for this OTP.'}` 
        });
      }

      clearUserOtp(user.id);

      return reply.send({
        api_key: user.api_key,
        user: {
          id:              user.id,
          whatsapp_number: user.whatsapp_number,
          plan:            user.plan,
          checks_limit:    user.checks_limit,
        },
      });
    },
  );
}
```