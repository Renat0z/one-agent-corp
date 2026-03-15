import axios from 'axios';

export class EvolutionService {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor() {
    this.baseUrl = process.env.EVOLUTION_URL || '';
    this.apiKey = process.env.EVOLUTION_API_KEY || '';
  }

  async sendMessage(instance: string, number: string, text: string) {
    try {
      await axios.post(`${this.baseUrl}/message/sendText/${instance}`, {
        number,
        options: { delay: 1200, presence: 'composing' },
        textMessage: { text }
      }, {
        headers: { apikey: this.apiKey }
      });
    } catch (error) {
      console.error('Failed to send message via Evolution:', error);
    }
  }
}