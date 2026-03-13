import { ShopifyConnector, GoogleAdsConnector } from './connectors';

async function runCiclo1Test() {
  console.log('🧪 Iniciando Teste Mínimo do Ciclo 1 (Autenticação e Listagem)\n');

  // Configurações Mock (Deverão vir do .env no Ciclo 2)
  const shopifyConfig = {
    clientId: 'sh_client_123',
    clientSecret: 'sh_secret_456',
    redirectUri: 'https://profitbridge.ai/auth/shopify/callback',
    scopes: ['read_products', 'read_inventory']
  };

  const gAdsConfig = {
    clientId: 'gads_client_123',
    clientSecret: 'gads_secret_456',
    redirectUri: 'https://profitbridge.ai/auth/google/callback',
    scopes: ['https://www.googleapis.com/auth/adwords']
  };

  const shopify = new ShopifyConnector(shopifyConfig);
  const google = new GoogleAdsConnector(gAdsConfig);

  // 1. Simular Fluxo Shopify
  console.log('--- Shopify Step ---');
  console.log('URL de Auth:', shopify.getAuthUrl('loja-exemplo'));
  const shopifyToken = await shopify.exchangeCode('loja-exemplo', 'fake_code');
  const skus = await shopify.listSkus('loja-exemplo', shopifyToken);
  console.log('SKUs Encontrados:', JSON.stringify(skus, null, 2));

  // 2. Simular Fluxo Google Ads
  console.log('\n--- Google Ads Step ---');
  console.log('URL de Auth:', google.getAuthUrl());
  const campaigns = await google.listCampaigns('fake_token');
  console.log('Campanhas Encontradas:', JSON.stringify(campaigns, null, 2));

  console.log('\n✅ Teste Mínimo do Ciclo 1 Concluído.');
}

runCiclo1Test();
