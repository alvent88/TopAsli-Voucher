import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import db from "../db";

export interface Product {
  id: number;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  iconUrl: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CreateProductRequest {
  name: string;
  slug: string;
  category: string;
  description?: string;
  iconUrl?: string;
}

export interface CreateProductResponse {
  success: boolean;
  id: number;
}

export const createProduct = api<CreateProductRequest, CreateProductResponse>(
  { expose: true, method: "POST", path: "/admin/products", auth: true },
  async ({ name, slug, category, description, iconUrl }) => {
    const auth = getAuthData()!;
    
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Only admin can create products");
    }

    const row = await db.queryRow<{ id: number }>`
      INSERT INTO products (name, slug, category, description, icon_url)
      VALUES (${name}, ${slug}, ${category}, ${description || null}, ${iconUrl || null})
      RETURNING id
    `;

    if (!row) {
      throw APIError.internal("Failed to create product");
    }

    return { success: true, id: row.id };
  }
);

export interface UpdateProductRequest {
  productId: number;
  name?: string;
  slug?: string;
  category?: string;
  description?: string;
  iconUrl?: string;
  isActive?: boolean;
}

export interface UpdateProductResponse {
  success: boolean;
}

export const updateProduct = api<UpdateProductRequest, UpdateProductResponse>(
  { expose: true, method: "PUT", path: "/admin/products/:productId", auth: true },
  async ({ productId, name, slug, category, description, iconUrl, isActive }) => {
    const auth = getAuthData()!;
    
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Only admin can update products");
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (slug !== undefined) {
      updates.push(`slug = $${paramIndex++}`);
      values.push(slug);
    }
    if (category !== undefined) {
      updates.push(`category = $${paramIndex++}`);
      values.push(category);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description);
    }
    if (iconUrl !== undefined) {
      updates.push(`icon_url = $${paramIndex++}`);
      values.push(iconUrl);
    }
    if (isActive !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(isActive);
    }

    if (updates.length === 0) {
      return { success: true };
    }

    updates.push(`updated_at = NOW()`);
    values.push(productId);

    const query = `UPDATE products SET ${updates.join(", ")} WHERE id = $${paramIndex}`;
    await db.rawQueryAll(query, ...values);

    return { success: true };
  }
);

export interface DeleteProductRequest {
  productId: number;
}

export interface DeleteProductResponse {
  success: boolean;
}

export const deleteProduct = api<DeleteProductRequest, DeleteProductResponse>(
  { expose: true, method: "DELETE", path: "/admin/products/:productId", auth: true },
  async ({ productId }) => {
    const auth = getAuthData()!;
    
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Only admin can delete products");
    }

    await db.exec`DELETE FROM products WHERE id = ${productId}`;

    return { success: true };
  }
);
