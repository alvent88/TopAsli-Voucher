import { api } from "encore.dev/api";
import db from "../db";

export interface Product {
  id: number;
  name: string;
  slug: string;
  category: string;
  iconUrl: string | null;
  description: string | null;
  isActive: boolean;
  isFeatured: boolean;
  requiresServerId?: boolean;
  uniplayEntitasId?: string | null;
}

interface ListProductsParams {
  category?: string;
}

interface ListProductsResponse {
  products: Product[];
}

// Retrieves all active products, optionally filtered by category.
export const list = api<ListProductsParams, ListProductsResponse>(
  { expose: true, method: "GET", path: "/products" },
  async ({ category }) => {
    let query = `SELECT id, name, slug, category, icon_url, description, is_active, is_featured, requires_server_id FROM products WHERE is_active = true`;
    const params: any[] = [];

    if (category) {
      query += ` AND category = $1`;
      params.push(category);
    }

    query += ` ORDER BY name`;

    const rows = await db.rawQueryAll<any>(query, ...params);
    const products = rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      category: row.category,
      iconUrl: row.icon_url,
      description: row.description,
      isActive: row.is_active,
      isFeatured: row.is_featured || false,
      requiresServerId: row.requires_server_id ?? true,
    }));

    return { products };
  }
);
