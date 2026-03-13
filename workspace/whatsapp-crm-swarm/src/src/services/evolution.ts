import axios from 'axios';

const EVOLUTION_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY;

export const EvolutionService = {
  sendMessage: async (instance: string, number: string, text: string) => {
    try {
      await axios.post(`${EVOLUTION_URL}/message/sendText/${instance}`, {
        number,
        text,
        delay: 1200,
        linkPreview: false
      }, {
        headers: { 'apikey': EVOLUTION_KEY }
      });
    } catch (error) {
      console.error('Evolution API Error:', error);
    }
  }
};