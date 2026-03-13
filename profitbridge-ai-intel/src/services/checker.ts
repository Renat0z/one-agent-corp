import { queries, Check } from '../db/queries';

const TIMEOUT_MS = Number(process.env.CHECK_TIMEOUT_MS) || 5000;

export async function checkService(check: Check) {
  const start = Date.now();
  let status = 0;
  let success = false;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(check.url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'ProfitBridge-AI-Intel-Checker/1.0' }
    });
    
    clearTimeout(timeout);
    status = response.status;
    success = status === check.expected_status;
  } catch (error) {
    status = 500;
    success = false;
  }

  const responseTime = Date.now() - start;
  const now = new Date().toISOString();

  // Log to DB
  queries.logCheck(check.id, status, responseTime, success);
  queries.updateCheckResult(check.id, status, now);

  if (!success) {
    await sendAlert(check, status);
  }

  return { id: check.id, success, status, responseTime };
}

async function sendAlert(check: Check, currentStatus: number) {
  const webhookUrl = check.alert_webhook_url || process.env.ALERT_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        alert: 'SERVICE_DOWN',
        service_name: check.name,
        url: check.url,
        status: currentStatus,
        expected: check.expected_status,
        timestamp: new Date().toISOString()
      })
    });
  } catch (err) {
    console.error(`Failed to send alert for ${check.name}:`, err);
  }
}
