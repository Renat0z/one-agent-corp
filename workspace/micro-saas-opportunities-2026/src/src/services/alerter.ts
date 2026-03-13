import axios from 'axios';

export class Alerter {
  static async sendWhatsApp(phone: string, message: string) {
    const instance = process.env.EVOLUTION_INSTANCE;
    const apiKey = process.env.EVOLUTION_API_KEY;
    const url = `${process.env.EVOLUTION_URL}/message/sendText/${instance}`;

    if (!instance || !apiKey) {
      console.log(`[SIMULATION] WhatsApp to ${phone}: ${message}`);
      return;
    }

    try {
      await axios.post(url, {
        number: phone,
        text: message
      }, {
        headers: { 'apikey': apiKey }
      });
    } catch (err) {
      console.error('Failed to send WhatsApp alert', err);
    }
  }
}