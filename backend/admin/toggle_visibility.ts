import { api, Header } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import db from "../db";
import { logAuditAction } from "../audit/logger";

export interface ToggleProductRequest {
  productId: number;
  isActive: boolean;
}

export interface ToggleProductResponse {
  success: boolean;
  productId: number;
  isActive: boolean;
}

export const toggleProduct = api<ToggleProductRequest, ToggleProductResponse>(
  { expose: true, method: "POST", path: "/admin/toggle-product", auth: true },
  async (req: ToggleProductRequest, ipAddress?: Header<"x-forwarded-for">, userAgent?: Header<"user-agent">) => {
    const auth = getAuthData()!;
    
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Only admin can toggle product");
    }

    try {
      await db.exec`
        UPDATE products 
        SET is_active = ${req.isActive}, updated_at = NOW()
        WHERE id = ${req.productId}
      `;

      console.log(`✅ Product ${req.productId} set to ${req.isActive ? 'active' : 'inactive'}`);
      
      await logAuditAction({
        actionType: "TOGGLE",
        entityType: "PRODUCT",
        entityId: req.productId.toString(),
        newValues: { isActive: req.isActive },
        metadata: { action: "visibility" },
      }, ipAddress, userAgent);

      return {
        success: true,
        productId: req.productId,
        isActive: req.isActive,
      };
    } catch (err) {
      console.error("❌ Failed to toggle product:", err);
      throw APIError.internal(
        err instanceof Error ? err.message : "Failed to toggle product"
      );
    }
  }
);

export interface TogglePackageRequest {
  packageId: number;
  isActive: boolean;
}

export interface TogglePackageResponse {
  success: boolean;
  packageId: number;
  isActive: boolean;
}

export const togglePackage = api<TogglePackageRequest, TogglePackageResponse>(
  { expose: true, method: "POST", path: "/admin/toggle-package", auth: true },
  async (req: TogglePackageRequest, ipAddress?: Header<"x-forwarded-for">, userAgent?: Header<"user-agent">) => {
    const auth = getAuthData()!;
    
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Only admin can toggle package");
    }

    try {
      await db.exec`
        UPDATE packages 
        SET is_active = ${req.isActive}, updated_at = NOW()
        WHERE id = ${req.packageId}
      `;

      console.log(`✅ Package ${req.packageId} set to ${req.isActive ? 'active' : 'inactive'}`);
      
      await logAuditAction({
        actionType: "TOGGLE",
        entityType: "PACKAGE",
        entityId: req.packageId.toString(),
        newValues: { isActive: req.isActive },
        metadata: { action: "visibility" },
      }, ipAddress, userAgent);

      return {
        success: true,
        packageId: req.packageId,
        isActive: req.isActive,
      };
    } catch (err) {
      console.error("❌ Failed to toggle package:", err);
      throw APIError.internal(
        err instanceof Error ? err.message : "Failed to toggle package"
      );
    }
  }
);

export interface ToggleFeaturedRequest {
  productId: number;
  isFeatured: boolean;
}

export interface ToggleFeaturedResponse {
  success: boolean;
  productId: number;
  isFeatured: boolean;
}

export const toggleFeatured = api<ToggleFeaturedRequest, ToggleFeaturedResponse>(
  { expose: true, method: "POST", path: "/admin/toggle-featured", auth: true },
  async (req: ToggleFeaturedRequest, ipAddress?: Header<"x-forwarded-for">, userAgent?: Header<"user-agent">) => {
    const auth = getAuthData()!;
    
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Only admin can toggle featured");
    }

    try {
      // Check how many products are currently featured
      const featuredCount = await db.queryRow<{ count: string }>`
        SELECT COUNT(*)::TEXT as count FROM products WHERE is_featured = true
      `;

      const currentCount = parseInt(featuredCount?.count || "0");

      // If trying to set featured to true and already have 5 featured products
      if (req.isFeatured && currentCount >= 5) {
        throw new Error("Maksimal 5 produk unggulan. Nonaktifkan produk lain terlebih dahulu.");
      }

      await db.exec`
        UPDATE products 
        SET is_featured = ${req.isFeatured}, updated_at = NOW()
        WHERE id = ${req.productId}
      `;

      console.log(`✅ Product ${req.productId} featured status set to ${req.isFeatured}`);
      
      await logAuditAction({
        actionType: "TOGGLE",
        entityType: "PRODUCT",
        entityId: req.productId.toString(),
        newValues: { isFeatured: req.isFeatured },
        metadata: { action: "featured" },
      }, ipAddress, userAgent);

      return {
        success: true,
        productId: req.productId,
        isFeatured: req.isFeatured,
      };
    } catch (err) {
      console.error("❌ Failed to toggle featured:", err);
      throw APIError.internal(
        err instanceof Error ? err.message : "Failed to toggle featured"
      );
    }
  }
);
