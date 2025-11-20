import { api, Header } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import db from "../db";
import { logAuditAction } from "../audit/logger";
import { extractAuditHeaders } from "../audit/extract_headers";

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
  async (
    req: ToggleSpecialItemRequest,
    xForwardedFor?: Header<"x-forwarded-for">,
    xRealIp?: Header<"x-real-ip">,
    cfConnectingIp?: Header<"cf-connecting-ip">,
    trueClientIp?: Header<"true-client-ip">,
    userAgent?: Header<"user-agent">
  ) => {
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
    }, extractAuditHeaders(xForwardedFor, xRealIp, cfConnectingIp, trueClientIp, userAgent));

    return {
      success: true,
      packageId: req.packageId,
      isSpecialItem: req.isSpecialItem,
    };
  }
);
