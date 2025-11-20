import { api, Header } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import db from "../db";
import { logAuditAction } from "../audit/logger";
import { extractAuditHeaders } from "../audit/extract_headers";

export interface ToggleServerIdRequest {
  productId: number;
  requiresServerId: boolean;
}

export interface ToggleServerIdResponse {
  success: boolean;
  productId: number;
  requiresServerId: boolean;
}

export const toggleServerIdRequirement = api<ToggleServerIdRequest, ToggleServerIdResponse>(
  { expose: true, method: "POST", path: "/admin/toggle-server-id", auth: true },
  async (
    req: ToggleServerIdRequest,
    xForwardedFor?: Header<"x-forwarded-for">,
    xRealIp?: Header<"x-real-ip">,
    cfConnectingIp?: Header<"cf-connecting-ip">,
    trueClientIp?: Header<"true-client-ip">,
    userAgent?: Header<"user-agent">
  ) => {
    const auth = getAuthData()!;
    
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Only admin can toggle server ID requirement");
    }

    try {
      await db.exec`
        UPDATE products 
        SET requires_server_id = ${req.requiresServerId}, updated_at = NOW()
        WHERE id = ${req.productId}
      `;

      console.log(`✅ Product ${req.productId} requires_server_id set to ${req.requiresServerId}`);
      
      await logAuditAction({
        actionType: "TOGGLE",
        entityType: "PRODUCT",
        entityId: req.productId.toString(),
        newValues: { requiresServerId: req.requiresServerId },
        metadata: { action: "serverIdRequirement" },
      }, extractAuditHeaders(xForwardedFor, xRealIp, cfConnectingIp, trueClientIp, userAgent));

      return {
        success: true,
        productId: req.productId,
        requiresServerId: req.requiresServerId,
      };
    } catch (err) {
      console.error("❌ Failed to toggle server ID requirement:", err);
      throw APIError.internal(
        err instanceof Error ? err.message : "Failed to toggle server ID requirement"
      );
    }
  }
);
