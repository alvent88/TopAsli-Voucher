import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import db from "../db";

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
  async (req: ToggleSpecialItemRequest) => {
    const auth = getAuthData()!;

    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Only admin can toggle special item status");
    }

    await db.exec`
      UPDATE packages 
      SET is_special_item = ${req.isSpecialItem}
      WHERE id = ${req.packageId}
    `;

    return {
      success: true,
      packageId: req.packageId,
      isSpecialItem: req.isSpecialItem,
    };
  }
);
