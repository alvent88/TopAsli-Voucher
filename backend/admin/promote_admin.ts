import { api, Header } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import db from "../db";
import { logAuditAction } from "../audit/logger";

export interface PromoteToAdminRequest {
  userId: string;
  role: "admin" | "superadmin";
}

export interface PromoteToAdminResponse {
  success: boolean;
  message: string;
}

export const promoteToAdmin = api<PromoteToAdminRequest, PromoteToAdminResponse>(
  { expose: true, method: "POST", path: "/admin/users/:userId/promote", auth: true },
  async ({ userId, role }, ipAddress?: Header<"x-forwarded-for">, userAgent?: Header<"user-agent">) => {
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
      const user = await db.queryRow<{ phone_number: string }>`
        SELECT phone_number FROM users WHERE clerk_user_id = ${userId}
      `;
      
      if (!user) {
        throw APIError.notFound("User not found");
      }

      console.log(`User promoted to ${role} successfully`);
      
      await logAuditAction({
        actionType: "PROMOTE",
        entityType: "ADMIN",
        entityId: userId,
        oldValues: { isAdmin: false, isSuperAdmin: false },
        newValues: { isAdmin: role === "admin" || role === "superadmin", isSuperAdmin: role === "superadmin" },
        metadata: { role, targetUserPhone: user.phone_number },
      }, ipAddress, userAgent);

      return {
        success: true,
        message: `User berhasil diangkat menjadi ${role === "superadmin" ? "superadmin" : "admin"}. Note: Admin status is determined by phone number 62818848168`,
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

export interface DemoteFromAdminRequest {
  userId: string;
}

export interface DemoteFromAdminResponse {
  success: boolean;
  message: string;
}

export const demoteFromAdmin = api<DemoteFromAdminRequest, DemoteFromAdminResponse>(
  { expose: true, method: "POST", path: "/admin/users/:userId/demote", auth: true },
  async ({ userId }, ipAddress?: Header<"x-forwarded-for">, userAgent?: Header<"user-agent">) => {
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
      const user = await db.queryRow<{ phone_number: string }>`
        SELECT phone_number FROM users WHERE clerk_user_id = ${userId}
      `;
      
      if (!user) {
        throw APIError.notFound("User not found");
      }

      console.log("User demoted from admin successfully");
      
      await logAuditAction({
        actionType: "PROMOTE",
        entityType: "ADMIN",
        entityId: userId,
        oldValues: { isAdmin: true, isSuperAdmin: false },
        newValues: { isAdmin: false, isSuperAdmin: false },
        metadata: { action: "demote", targetUserPhone: user.phone_number },
      }, ipAddress, userAgent);

      return {
        success: true,
        message: "User berhasil diturunkan dari admin. Note: Admin status is determined by phone number 62818848168",
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
