import { api } from "encore.dev/api";
import db from "../db";
import type { Product } from "../product/list";

interface ListAllProductsResponse {
  products: Product[];
}

export const listAllProducts = api<void, ListAllProductsResponse>(
  { expose: true, method: "GET", path: "/admin/products", auth: true },
  async () => {
    const rows = await db.queryAll<any>`
      SELECT id, name, slug, category, icon_url, description, is_active, is_featured, uniplay_entitas_id
      FROM products
      ORDER BY name
    `;

    const products = rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      category: row.category,
      iconUrl: row.icon_url,
      description: row.description,
      isActive: row.is_active,
      isFeatured: row.is_featured || false,
      uniplayEntitasId: row.uniplay_entitas_id,
    }));

    return { products };
  }
);
