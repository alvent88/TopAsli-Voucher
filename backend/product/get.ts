import { api, APIError } from "encore.dev/api";
import db from "../db";
import type { Product } from "./list";

interface GetProductParams {
  slug: string;
}

// Retrieves a product by its slug.
export const get = api<GetProductParams, Product>(
  { expose: true, method: "GET", path: "/products/:slug" },
  async ({ slug }) => {
    const row = await db.queryRow<any>`
      SELECT id, name, slug, category, icon_url, description, is_active, is_featured, requires_server_id
      FROM products
      WHERE slug = ${slug} AND is_active = true
    `;

    if (!row) {
      throw APIError.notFound("product not found");
    }

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      category: row.category,
      iconUrl: row.icon_url,
      description: row.description,
      isActive: row.is_active,
      isFeatured: row.is_featured || false,
      requiresServerId: row.requires_server_id ?? true,
    };
  }
);
