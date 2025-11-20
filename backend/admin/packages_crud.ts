import { api, Header } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import db from "../db";
import { logAuditAction } from "../audit/logger";
import { extractAuditHeaders } from "../audit/extract_headers";

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
  uniplayEntitasId?: string;
  uniplayDenomId?: string;
}

export interface CreatePackageResponse {
  success: boolean;
  id: number;
}

export const createPackage = api<CreatePackageRequest, CreatePackageResponse>(
  { expose: true, method: "POST", path: "/admin/packages", auth: true },
  async (
    { productId, name, amount, unit, price, discountPrice, uniplayEntitasId, uniplayDenomId },
    xForwardedFor?: Header<"x-forwarded-for">,
    xRealIp?: Header<"x-real-ip">,
    cfConnectingIp?: Header<"cf-connecting-ip">,
    trueClientIp?: Header<"true-client-ip">,
    userAgent?: Header<"user-agent">
  ) => {
    const auth = getAuthData()!;
    
    if (!auth.isSuperAdmin) {
      throw APIError.permissionDenied("Only superadmin can create packages");
    }

    const row = await db.queryRow<{ id: number }>`
      INSERT INTO packages (product_id, name, amount, unit, price, discount_price, uniplay_entitas_id, uniplay_denom_id)
      VALUES (${productId}, ${name}, ${amount}, ${unit}, ${price}, ${discountPrice || null}, ${uniplayEntitasId || null}, ${uniplayDenomId || null})
      RETURNING id
    `;

    if (!row) {
      throw APIError.internal("Failed to create package");
    }
    
    await logAuditAction({
      actionType: "CREATE",
      entityType: "PACKAGE",
      entityId: row.id.toString(),
      newValues: { productId, name, amount, unit, price, discountPrice, uniplayEntitasId, uniplayDenomId },
    }, extractAuditHeaders(xForwardedFor, xRealIp, cfConnectingIp, trueClientIp, userAgent));

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
  uniplayEntitasId?: string;
  uniplayDenomId?: string;
}

export interface UpdatePackageResponse {
  success: boolean;
}

export const updatePackage = api<UpdatePackageRequest, UpdatePackageResponse>(
  { expose: true, method: "PUT", path: "/admin/packages/:packageId", auth: true },
  async (
    { packageId, productId, name, amount, unit, price, discountPrice, isActive, uniplayEntitasId, uniplayDenomId },
    xForwardedFor?: Header<"x-forwarded-for">,
    xRealIp?: Header<"x-real-ip">,
    cfConnectingIp?: Header<"cf-connecting-ip">,
    trueClientIp?: Header<"true-client-ip">,
    userAgent?: Header<"user-agent">
  ) => {
    const auth = getAuthData()!;
    
    if (!auth.isSuperAdmin) {
      throw APIError.permissionDenied("Only superadmin can update packages");
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
    if (uniplayEntitasId !== undefined) {
      updates.push(`uniplay_entitas_id = $${paramIndex++}`);
      values.push(uniplayEntitasId);
    }
    if (uniplayDenomId !== undefined) {
      updates.push(`uniplay_denom_id = $${paramIndex++}`);
      values.push(uniplayDenomId);
    }

    if (updates.length === 0) {
      return { success: true };
    }

    updates.push(`updated_at = NOW()`);
    values.push(packageId);

    const oldPackage = await db.queryRow<{ product_id: number; name: string; amount: number; unit: string; price: number; discount_price: number | null; is_active: boolean; uniplay_entitas_id: string | null; uniplay_denom_id: string | null }>` 
      SELECT product_id, name, amount, unit, price, discount_price, is_active, uniplay_entitas_id, uniplay_denom_id FROM packages WHERE id = ${packageId}
    `;
    
    const query = `UPDATE packages SET ${updates.join(", ")} WHERE id = $${paramIndex}`;
    await db.rawQueryAll(query, ...values);
    
    await logAuditAction({
      actionType: "UPDATE",
      entityType: "PACKAGE",
      entityId: packageId.toString(),
      oldValues: oldPackage ? {
        productId: oldPackage.product_id,
        name: oldPackage.name,
        amount: oldPackage.amount,
        unit: oldPackage.unit,
        price: oldPackage.price,
        discountPrice: oldPackage.discount_price,
        isActive: oldPackage.is_active,
        uniplayEntitasId: oldPackage.uniplay_entitas_id,
        uniplayDenomId: oldPackage.uniplay_denom_id,
      } : undefined,
      newValues: { productId, name, amount, unit, price, discountPrice, isActive, uniplayEntitasId, uniplayDenomId },
    }, extractAuditHeaders(xForwardedFor, xRealIp, cfConnectingIp, trueClientIp, userAgent));

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
  async (
    { packageId },
    xForwardedFor?: Header<"x-forwarded-for">,
    xRealIp?: Header<"x-real-ip">,
    cfConnectingIp?: Header<"cf-connecting-ip">,
    trueClientIp?: Header<"true-client-ip">,
    userAgent?: Header<"user-agent">
  ) => {
    const auth = getAuthData()!;
    
    if (!auth.isSuperAdmin) {
      throw APIError.permissionDenied("Only superadmin can delete packages");
    }

    const pkg = await db.queryRow<{ name: string; amount: number; price: number }>` 
      SELECT name, amount, price FROM packages WHERE id = ${packageId}
    `;
    
    await db.exec`DELETE FROM packages WHERE id = ${packageId}`;
    
    await logAuditAction({
      actionType: "DELETE",
      entityType: "PACKAGE",
      entityId: packageId.toString(),
      oldValues: pkg ? { name: pkg.name, amount: pkg.amount, price: pkg.price } : undefined,
    }, extractAuditHeaders(xForwardedFor, xRealIp, cfConnectingIp, trueClientIp, userAgent));

    return { success: true };
  }
);
