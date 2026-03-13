export async function sendAlert(recipient: string, message: string) {
    const { EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE_ID } = process.env;

    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
        console.warn('[Alerter] Evolution API not configured. Alert suppressed:', message);
        return;
    }

    try {
        await fetch(`${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE_ID}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': EVOLUTION_API_KEY
            },
            body: JSON.stringify({
                number: recipient,
                options: { delay: 1200, presence: 'composing' },
                textMessage: { text: message }
            })
        });
        console.log(`[Alerter] Alert sent to ${recipient}`);
    } catch (error) {
        console.error('[Alerter] Failed to send WhatsApp alert:', error);
    }
}