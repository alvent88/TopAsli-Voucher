import { api } from "encore.dev/api";
import db from "../db";
import type { Product } from "./list";

interface ListFeaturedProductsResponse {
  products: Product[];
}

export const listFeatured = api<void, ListFeaturedProductsResponse>(
  { expose: true, method: "GET", path: "/products/featured" },
  async () => {
    const rows = await db.queryAll<any>`
      SELECT id, name, slug, category, icon_url, description, is_active, is_featured
      FROM products
      WHERE is_active = true AND is_featured = true
      ORDER BY name
      LIMIT 5
    `;

    const products = rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      category: row.category,
      iconUrl: row.icon_url,
      description: row.description,
      isActive: row.is_active,
      isFeatured: row.is_featured,
    }));

    return { products };
  }
);
