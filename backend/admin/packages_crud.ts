import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import db from "../db";

export interface Package {
  id: number;
  productId: number;
  name: string;
  amount: number;
  unit: string;
  price: number;
  discountPrice: number | null;
  isActive: boolean;
}

export interface CreatePackageRequest {
  productId: number;
  name: string;
  amount: number;
  unit: string;
  price: number;
  discountPrice?: number;
}

export interface CreatePackageResponse {
  success: boolean;
  id: number;
}

export const createPackage = api<CreatePackageRequest, CreatePackageResponse>(
  { expose: true, method: "POST", path: "/admin/packages", auth: true },
  async ({ productId, name, amount, unit, price, discountPrice }) => {
    const auth = getAuthData()!;
    
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Only admin can create packages");
    }

    const row = await db.queryRow<{ id: number }>`
      INSERT INTO packages (product_id, name, amount, unit, price, discount_price)
      VALUES (${productId}, ${name}, ${amount}, ${unit}, ${price}, ${discountPrice || null})
      RETURNING id
    `;

    if (!row) {
      throw APIError.internal("Failed to create package");
    }

    return { success: true, id: row.id };
  }
);

export interface UpdatePackageRequest {
  packageId: number;
  productId?: number;
  name?: string;
  amount?: number;
  unit?: string;
  price?: number;
  discountPrice?: number;
  isActive?: boolean;
}

export interface UpdatePackageResponse {
  success: boolean;
}

export const updatePackage = api<UpdatePackageRequest, UpdatePackageResponse>(
  { expose: true, method: "PUT", path: "/admin/packages/:packageId", auth: true },
  async ({ packageId, productId, name, amount, unit, price, discountPrice, isActive }) => {
    const auth = getAuthData()!;
    
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Only admin can update packages");
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (productId !== undefined) {
      updates.push(`product_id = $${paramIndex++}`);
      values.push(productId);
    }
    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (amount !== undefined) {
      updates.push(`amount = $${paramIndex++}`);
      values.push(amount);
    }
    if (unit !== undefined) {
      updates.push(`unit = $${paramIndex++}`);
      values.push(unit);
    }
    if (price !== undefined) {
      updates.push(`price = $${paramIndex++}`);
      values.push(price);
    }
    if (discountPrice !== undefined) {
      updates.push(`discount_price = $${paramIndex++}`);
      values.push(discountPrice);
    }
    if (isActive !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(isActive);
    }

    if (updates.length === 0) {
      return { success: true };
    }

    updates.push(`updated_at = NOW()`);
    values.push(packageId);

    const query = `UPDATE packages SET ${updates.join(", ")} WHERE id = $${paramIndex}`;
    await db.rawQueryAll(query, ...values);

    return { success: true };
  }
);

export interface DeletePackageRequest {
  packageId: number;
}

export interface DeletePackageResponse {
  success: boolean;
}

export const deletePackage = api<DeletePackageRequest, DeletePackageResponse>(
  { expose: true, method: "DELETE", path: "/admin/packages/:packageId", auth: true },
  async ({ packageId }) => {
    const auth = getAuthData()!;
    
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Only admin can delete packages");
    }

    await db.exec`DELETE FROM packages WHERE id = ${packageId}`;

    return { success: true };
  }
);
