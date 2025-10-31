import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import db from "../db";

export interface ActivateAllCSResponse {
  success: boolean;
  message: string;
  updatedCount: number;
}

export const activateAllCS = api<void, ActivateAllCSResponse>(
  { expose: true, method: "POST", path: "/admin/whatsapp-cs/activate-all", auth: true },
  async () => {
    const auth = getAuthData()!;
    
    if (!auth.isSuperAdmin) {
      throw APIError.permissionDenied("Only superadmin can activate CS numbers");
    }

    try {
      // Update all CS numbers to active
      const result = await db.rawQueryAll<{ count: number }>(
        `UPDATE whatsapp_cs_numbers 
         SET is_active = true, updated_at = NOW() 
         WHERE is_active = false OR is_active IS NULL
         RETURNING id`
      );

      return { 
        success: true, 
        message: `Activated ${result.length} CS number(s)`,
        updatedCount: result.length 
      };
    } catch (err) {
      console.error("Activate all CS error:", err);
      throw APIError.internal("Failed to activate CS numbers", err as Error);
    }
  }
);
