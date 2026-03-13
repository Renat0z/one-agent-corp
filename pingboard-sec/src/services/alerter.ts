export async function sendAlert(checkName: string, type: 'down' | 'recovery', url: string) {
  const emoji = type === 'down' ? '🚨' : '✅';
  const message = `${emoji} *PINGBOARD ALERT*\n\n*Name:* ${checkName}\n*Status:* ${type.toUpperCase()}\n*URL:* ${url}\n*Time:* ${new Date().toISOString()}`;
  
  console.log(`[ALERTER] ${message}`);
  
  const webhookUrl = process.env.ALERT_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('[ALERTER] No ALERT_WEBHOOK_URL set, skipping external alert.');
    return;
  }

  try {
    // Expected format for Evolution API or similar: { "number": "...", "text": "..." }
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
  } catch (err) {
    console.error('[ALERTER] Failed to send alert via webhook:', err);
  }
}
