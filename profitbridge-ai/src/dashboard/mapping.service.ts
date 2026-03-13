export interface ProductMapping {
  id: string;
  skuId: string;
  adGroupId: string;
  shopName: string;
  isActive: boolean;
}

export class MappingService {
  private mappings: ProductMapping[] = [];

  addMapping(mapping: Omit<ProductMapping, 'id'>) {
    const newMapping = { ...mapping, id: `map_${Date.now()}` };
    this.mappings.push(newMapping);
    return newMapping;
  }

  getMappingsByShop(shopName: string) {
    return this.mappings.filter(m => m.shopName === shopName && m.isActive);
  }

  toggleMapping(id: string, status: boolean) {
    const map = this.mappings.find(m => m.id === id);
    if (map) map.isActive = status;
  }
}
