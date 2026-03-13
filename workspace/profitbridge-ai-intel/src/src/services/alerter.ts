import dotenv from 'dotenv';
dotenv.config();

export async function sendAlert(serviceName: string, url: string) {
  const webhookUrl = process.env.ALERT_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn(`Alert triggered for ${serviceName} but no webhook URL configured.`);
    return;
  }

  const payload = {
    text: `🚨 *Profit Guard Alert* 🚨\nService *${serviceName}* is DOWN!\nURL: ${url}\nTimestamp: ${new Date().toISOString()}`,
  };

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error('Failed to send alert notification:', error);
  }
}