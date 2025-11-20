import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import db from "../db";
import { logAuditAction } from "../audit/logger";
import type { WithAuditMetadata } from "../audit/types";

export interface PromoteToAdminRequest extends WithAuditMetadata {
  userId: string;
  role: "admin" | "superadmin";
}

export interface PromoteToAdminResponse {
  success: boolean;
  message: string;
}

export const promoteToAdmin = api<PromoteToAdminRequest, PromoteToAdminResponse>(
  { expose: true, method: "POST", path: "/admin/users/:userId/promote", auth: true },
  async ({ userId, role, _auditMetadata }) => {
    const auth = getAuthData()!;
    
    if (!auth.isSuperAdmin) {
      throw APIError.permissionDenied("Only superadmin can promote users to admin");
    }

    if (userId === auth.userID) {
      throw APIError.invalidArgument("Cannot modify your own admin status");
    }

    console.log("=== PROMOTE TO ADMIN START ===");
    console.log("Target user ID:", userId);
    console.log("Role:", role);
    console.log("Promoted by:", auth.userID);

    try {
      const user = await db.queryRow<{ phone_number: string; full_name: string }>`
        SELECT phone_number, full_name FROM users WHERE clerk_user_id = ${userId}
      `;
      
      if (!user) {
        throw APIError.notFound("User not found");
      }

      if (role === "superadmin") {
        await db.exec`
          UPDATE users
          SET is_superadmin = TRUE,
              is_admin = TRUE,
              updated_at = NOW()
          WHERE clerk_user_id = ${userId}
        `;
      } else {
        await db.exec`
          UPDATE users
          SET is_admin = TRUE,
              is_superadmin = FALSE,
              updated_at = NOW()
          WHERE clerk_user_id = ${userId}
        `;
      }

      console.log(`User ${user.full_name} promoted to ${role} successfully`);
      
      await logAuditAction({
        actionType: "PROMOTE",
        entityType: "ADMIN",
        entityId: userId,
        oldValues: { isAdmin: false, isSuperAdmin: false },
        newValues: { isAdmin: true, isSuperAdmin: role === "superadmin" },
        metadata: { role, targetUserPhone: user.phone_number },
      }, _auditMetadata);

      return {
        success: true,
        message: `User ${user.full_name} berhasil diangkat menjadi ${role === "superadmin" ? "superadmin" : "admin"}`,
      };
    } catch (err: any) {
      console.error("=== PROMOTE TO ADMIN ERROR ===");
      console.error("Error:", err);
      
      if (err instanceof APIError) {
        throw err;
      }
      
      throw APIError.internal(err.message || "Gagal mengangkat user menjadi admin");
    }
  }
);

export interface DemoteFromAdminRequest extends WithAuditMetadata {
  userId: string;
}

export interface DemoteFromAdminResponse {
  success: boolean;
  message: string;
}

export const demoteFromAdmin = api<DemoteFromAdminRequest, DemoteFromAdminResponse>(
  { expose: true, method: "POST", path: "/admin/users/:userId/demote", auth: true },
  async ({ userId, _auditMetadata }) => {
    const auth = getAuthData()!;
    
    if (!auth.isSuperAdmin) {
      throw APIError.permissionDenied("Only superadmin can demote admins");
    }

    if (userId === auth.userID) {
      throw APIError.invalidArgument("Cannot modify your own admin status");
    }

    console.log("=== DEMOTE FROM ADMIN START ===");
    console.log("Target user ID:", userId);
    console.log("Demoted by:", auth.userID);

    try {
      const user = await db.queryRow<{ phone_number: string; full_name: string }>`
        SELECT phone_number, full_name FROM users WHERE clerk_user_id = ${userId}
      `;
      
      if (!user) {
        throw APIError.notFound("User not found");
      }

      await db.exec`
        UPDATE users
        SET is_admin = FALSE,
            is_superadmin = FALSE,
            updated_at = NOW()
        WHERE clerk_user_id = ${userId}
      `;

      console.log(`User ${user.full_name} demoted from admin successfully`);
      
      await logAuditAction({
        actionType: "DEMOTE",
        entityType: "ADMIN",
        entityId: userId,
        oldValues: { isAdmin: true, isSuperAdmin: false },
        newValues: { isAdmin: false, isSuperAdmin: false },
        metadata: { action: "demote", targetUserPhone: user.phone_number },
      }, _auditMetadata);

      return {
        success: true,
        message: `User ${user.full_name} berhasil diturunkan dari admin`,
      };
    } catch (err: any) {
      console.error("=== DEMOTE FROM ADMIN ERROR ===");
      console.error("Error:", err);
      
      if (err instanceof APIError) {
        throw err;
      }
      
      throw APIError.internal(err.message || "Gagal menurunkan admin");
    }
  }
);
