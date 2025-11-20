import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import db from "../db";
import { logAuditAction } from "../audit/logger";
import type { WithAuditMetadata } from "../audit/types";

export interface ToggleSpecialItemRequest extends WithAuditMetadata {
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
  async (req) => {
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
    }, req._auditMetadata);

    return {
      success: true,
      packageId: req.packageId,
      isSpecialItem: req.isSpecialItem,
    };
  }
);
