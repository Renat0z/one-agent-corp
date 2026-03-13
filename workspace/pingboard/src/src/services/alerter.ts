```typescript
import { getConfig } from '../config.js';

export interface SendResult {
  success:   boolean;
  messageId: string | null;
  error?:    string;
}

export async function sendWhatsAppAlert(
  toNumber: string,
  message:  string,
): Promise<SendResult> {
  const config = getConfig();

  if (!config.EVOLUTION_API_KEY) {
    console.warn('[alerter] EVOLUTION_API_KEY not set — WhatsApp delivery skipped');
    return { success: false, messageId: null, error: 'not_configured' };
  }

  const number = toNumber.replace(/\D/g, ''); // E.164 digits only

  try {
    const res = await fetch(
      `${config.EVOLUTION_API_URL}/message/sendText/${config.EVOLUTION_INSTANCE}`,
      {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey':        config.EVOLUTION_API_KEY,
        },
        body: JSON.stringify({
          number,
          options:     { delay: 1200, presence: 'composing' },
          textMessage: { text: message },
        }),
        signal: AbortSignal.timeout(10_000),
      },
    );

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[alerter] Evolution API ${res.status}:`, body.slice(0, 200));
      return { success: false, messageId: null, error: `http_${res.status}` };
    }

    const data = await res.json() as { key?: { id?: string } };
    return { success: true, messageId: data?.key?.id ?? null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error('[alerter] send failed:', msg);
    return { success: false, messageId: null, error: msg };
  }
}

// ─── Message Templates ───────────────────────────────────────────────────────

function brTime(): string {
  return new Date().toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

export function buildDownMessage(
  name:       string,
  url:        string,
  responseMs: number,
  errorMsg:   string | null,
): string {
  const errorLine = errorMsg ? `\nErro: \`${errorMsg}\`` : '';
  return (
    `🔴 *ALERTA DE QUEDA*\n\n` +
    `*${name}* está fora do ar\n\n` +
    `🔗 ${url}\n` +
    `⏱ Resposta: ${responseMs}ms${errorLine}\n` +
    `🕐 ${brTime()} (Brasília)\n\n` +
    `_Monitorado por Pingboard_`
  );
}

export function buildRecoveryMessage(
  name:        string,
  url:         string,
  downtimeSec: number,
): string {
  const duration = downtimeSec >= 60
    ? `${Math.round(downtimeSec / 60)} min`
    : `${downtimeSec} seg`;
  return (
    `🟢 *SERVIÇO RECUPERADO*\n\n` +
    `*${name}* voltou ao ar!\n\n` +
    `🔗 ${url}\n` +
    `⏳ Fora por ~${duration}\n` +
    `🕐 ${brTime()} (Brasília)\n\n` +
    `_Monitorado por Pingboard_`
  );
}

export function buildOtpMessage(otp: string): string {
  return (
    `🔐 *Pingboard — Código de verificação*\n\n` +
    `Seu código é: *${otp}*\n\n` +
    `Válido por 10 minutos. Não compartilhe.\n\n` +
    `_Se não foi você, ignore esta mensagem._`
  );
}
```