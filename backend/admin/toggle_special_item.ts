import { api, Header } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import db from "../db";
import { logAuditAction } from "../audit/logger";

export interface ToggleSpecialItemRequest {
  packageId: number;
  isSpecialItem: boolean;
}

export interface ToggleSpecialItemResponse {
  success: boolean;
  packageId: number;
  isSpecialItem: boolean;
}

export const toggleSpecialItem = api<ToggleSpecialItemRequest, ToggleSpecialItemResponse>(
  { expose: true, method: "POST", path: "/admin/toggle-special-item", auth: true },
  async (req: ToggleSpecialItemRequest, ipAddress?: Header<"x-forwarded-for">, userAgent?: Header<"user-agent">) => {
    const auth = getAuthData()!;

    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Only admin can toggle special item status");
    }

    await db.exec`
      UPDATE packages 
      SET is_special_item = ${req.isSpecialItem}
      WHERE id = ${req.packageId}
    `;
    
    await logAuditAction({
      actionType: "TOGGLE",
      entityType: "PACKAGE",
      entityId: req.packageId.toString(),
      newValues: { isSpecialItem: req.isSpecialItem },
      metadata: { action: "specialItem" },
    }, ipAddress, userAgent);

    return {
      success: true,
      packageId: req.packageId,
      isSpecialItem: req.isSpecialItem,
    };
  }
);
