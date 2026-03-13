import { Database } from './schema.js';

export interface Sku {
  shopify_id: string;
  handle: string;
  price: number;
  cogs: number;
  stock: number;
  margin: number;
  status: string;
}

export class Queries {
  static upsertSku(sku: Sku) {
    const stmt = Database.db.prepare(`
      INSERT INTO skus (shopify_id, handle, price, cogs, stock, margin, status, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(shopify_id) DO UPDATE SET
        price=excluded.price,
        stock=excluded.stock,
        margin=excluded.margin,
        status=excluded.status,
        updated_at=CURRENT_TIMESTAMP
    `);
    return stmt.run(sku.shopify_id, sku.handle, sku.price, sku.cogs, sku.stock, sku.margin, sku.status);
  }

  static getAllSkus() {
    return Database.db.prepare('SELECT * FROM skus ORDER BY margin ASC').all();
  }
}