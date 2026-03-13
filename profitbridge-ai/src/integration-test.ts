import { ShopifyInventoryService } from './services/shopify/inventory.service';
import { GoogleAdsCampaignService } from './services/google-ads/campaign.service';
import { ProfitBridgeApp } from './index';

async function finalIntegrationTest() {
  console.log('🧪 INICIANDO TESTE DE INTEGRAÇÃO FINAL — PROFITBRIDGE AI\n');

  // 1. Mocks de Dados
  const mockToken = 'mock_token_abc_123';
  const shopName = 'loja-teste-hormozi';
  const customerId = '123-456-7890';

  // 2. Instanciar Serviços (Usando as classes reais com dados mockados)
  // Nota: Em um teste real de integração, axios falharia sem internet/endpoint.
  // Aqui vamos sobrescrever o fetch para simular o comportamento das APIs.
  
  const shopify = new ShopifyInventoryService(shopName, mockToken);
  const gads = new GoogleAdsCampaignService(customerId, mockToken, 'dev_token_xyz');

  // Sobrescrevendo métodos para não depender de rede no teste de integração local
  shopify.fetchAllProducts = async () => [
    {
      id: 'prod_blue_shirt',
      title: 'Blue Shirt',
      variants: [{ id: 'var_1', inventory_quantity: 2 }] // Estoque Baixo!
    },
    {
      id: 'prod_red_shoes',
      title: 'Red Shoes',
      variants: [{ id: 'var_2', inventory_quantity: 50 }] // Estoque Saudável
    }
  ];

  gads.pauseAdGroup = async (id: string) => {
    console.log(`[API Google Ads] Chamada de PAUSE executada para AdGroup: ${id}`);
  };

  // 3. Inicializar App (Shadow Mode OFF para ver as ações)
  const app = new ProfitBridgeApp(shopify, gads, false);

  // 4. Definir Mapeamento (O que o usuário configuraria no Dashboard)
  const mappings = [
    {
      skuId: 'prod_blue_shirt',
      adGroupId: 'adgroup_blue_ads_1',
      safeThreshold: 5 // Pausa se DOI < 5 dias (com 2 em estoque e 5 vendas/dia, DOI = 0.4)
    },
    {
      skuId: 'prod_red_shoes',
      adGroupId: 'adgroup_red_ads_2',
      safeThreshold: 2 // DOI = 50/5 = 10. Não deve pausar.
    }
  ];

  // 5. Rodar Ciclo
  await app.runSyncCycle(mappings);

  console.log('\n✅ TESTE DE INTEGRAÇÃO FINAL CONCLUÍDO.');
}

finalIntegrationTest().catch(console.error);
