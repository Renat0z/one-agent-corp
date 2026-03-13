/**
 * ProfitBridge AI — OAuth & Connector Boilerplate
 * Ciclo 1: Conectividade Shopify & Google Ads
 */

export interface AuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export class ShopifyConnector {
  constructor(private config: AuthConfig) {}

  /**
   * Passo 1: Gerar URL de Autorização
   */
  getAuthUrl(shopName: string): string {
    const scopeString = this.config.scopes.join(',');
    return `https://${shopName}.myshopify.com/admin/oauth/authorize?client_id=${this.config.clientId}&scope=${scopeString}&redirect_uri=${this.config.redirectUri}`;
  }

  /**
   * Passo 2: Trocar Code por Access Token (Simulado para C1)
   */
  async exchangeCode(shopName: string, code: string): Promise<string> {
    console.log(`[Shopify] Trocando code por token para ${shopName}...`);
    // Em produção: POST para https://${shopName}.myshopify.com/admin/oauth/access_token
    return "shpat_mock_token_12345"; 
  }

  /**
   * Passo 3: Listar SKUs (Mínimo Testável do C1)
   */
  async listSkus(shopName: string, token: string) {
    console.log(`[Shopify] Buscando SKUs para ${shopName}...`);
    // Em produção: GET /admin/api/2024-01/products.json?fields=variants
    return [
      { id: "sku_001", name: "T-Shirt Blue", inventory: 15, price: 29.90 },
      { id: "sku_002", name: "T-Shirt Red", inventory: 2, price: 29.90 },
    ];
  }
}

export class GoogleAdsConnector {
  constructor(private config: AuthConfig) {}

  getAuthUrl(): string {
    const scopeString = this.config.scopes.join(' ');
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${this.config.clientId}&redirect_uri=${this.config.redirectUri}&response_type=code&scope=${scopeString}&access_type=offline`;
  }

  async listCampaigns(token: string) {
    console.log(`[GoogleAds] Listando campanhas ativas...`);
    // Em produção: POST /v15/customers/${customerId}/googleAds:search
    return [
      { id: "camp_999", name: "Search_Brasil_Lookalike", status: "ENABLED", dailyBudget: 150.00 },
    ];
  }
}
