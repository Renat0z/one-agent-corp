import axios from 'axios';

export class ShopifyAuthService {
  constructor(private clientId: string, private clientSecret: string) {}

  generateAuthUrl(shopName: string, redirectUri: string): string {
    const scopes = 'read_products,read_inventory,write_products';
    return `https://${shopName}.myshopify.com/admin/oauth/authorize?client_id=${this.clientId}&scope=${scopes}&redirect_uri=${redirectUri}`;
  }

  async getAccessToken(shopName: string, code: string): Promise<string> {
    const url = `https://${shopName}.myshopify.com/admin/oauth/access_token`;
    const response = await axios.post(url, {
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code
    });
    return response.data.access_token;
  }
}
