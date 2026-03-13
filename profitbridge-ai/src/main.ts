import { ShopifyInventoryService } from './services/shopify/inventory.service';
import { GoogleAdsCampaignService } from './services/google-ads/campaign.service';
import { ProfitBridgeApp } from './index';
import dotenv from 'dotenv';

dotenv.config();

async function startApp() {
  console.log('🌟 ProfitBridge AI - Iniciando em Produção');

  const shopName = process.env.SHOPIFY_SHOP_NAME!;
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN!;
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID!;
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN!;
  const isShadowMode = process.env.SHADOW_MODE === 'true';

  const shopify = new ShopifyInventoryService(shopName, accessToken);
  const gads = new GoogleAdsCampaignService(customerId, accessToken, developerToken);

  const app = new ProfitBridgeApp(shopify, gads, isShadowMode);

  // Aqui carregaríamos os mapeamentos de um banco de dados real futuramente.
  // Por enquanto, usamos a estrutura definida no PRD.
  const mappings: any[] = []; 

  console.log(`Modo: ${isShadowMode ? '🔍 SHADOW (Simulação)' : '🚀 LIVE (Execução)'}`);
  
  await app.runSyncCycle(mappings);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startApp().catch(console.error);
}
