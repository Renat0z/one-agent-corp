import axios from 'axios';

export class ShopifyInventoryService {
  constructor(private shopName: string, private accessToken: string) {}

  async fetchAllProducts() {
    const url = `https://${this.shopName}.myshopify.com/admin/api/2024-01/products.json?fields=id,title,variants`;
    const response = await axios.get(url, {
      headers: { 'X-Shopify-Access-Token': this.accessToken }
    });
    return response.data.products;
  }

  async updateInventoryLevel(inventoryItemId: string, locationId: string, delta: number) {
    const url = `https://${this.shopName}.myshopify.com/admin/api/2024-01/inventory_levels/adjust.json`;
    await axios.post(url, {
      location_id: locationId,
      inventory_item_id: inventoryItemId,
      available_adjustment: delta
    }, {
      headers: { 'X-Shopify-Access-Token': this.accessToken }
    });
  }
}
