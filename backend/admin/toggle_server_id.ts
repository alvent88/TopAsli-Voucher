import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import db from "../db";

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
  async (req: ToggleServerIdRequest) => {
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
