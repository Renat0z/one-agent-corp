export const SALES_KNOWLEDGE_BASE = {
  security: "Nossa conexão com Shopify e Google Ads é via OAuth2 Oficial. Temos acesso apenas de 'Leitura e Edição de Lances'. Nunca tocamos nos seus dados de clientes ou cartões.",
  complexity: "O setup leva 2 minutos. Você conecta as APIs e nós fazemos o resto. Não precisa configurar regras.",
  competition: "Diferente do TripleWhale, nós não apenas mostramos o dado, nós agimos no leilão de lances para proteger sua margem em tempo real.",
  guarantee: "Se não economizarmos 3x o valor da ferramenta em 30 dias, o software pausa a cobrança automaticamente. O risco é 100% nosso."
};

export class SalesCloserAgent {
  generateResponse(objectionKey: keyof typeof SALES_KNOWLEDGE_BASE): string {
    const answer = SALES_KNOWLEDGE_BASE[objectionKey];
    return `Entendo perfeitamente sua preocupação. ${answer} Faz sentido avançarmos com o teste de 30 dias sem risco?`;
  }
}
