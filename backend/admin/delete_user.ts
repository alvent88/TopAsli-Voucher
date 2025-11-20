import { api } from "encore.dev/api";
import { APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import { logAuditAction } from "../audit/logger";
import type { WithAuditMetadata } from "../audit/types";

export interface DeleteUserRequest extends WithAuditMetadata {
  userId: string;
}

export interface DeleteUserResponse {
  success: boolean;
}

export const deleteUser = api<DeleteUserRequest, DeleteUserResponse>(
  { expose: true, method: "DELETE", path: "/admin/users/:userId", auth: true },
  async ({ userId, _auditMetadata }) => {
    const auth = getAuthData();
    if (!auth || !auth.isSuperAdmin) {
      throw APIError.permissionDenied("Superadmin access required");
    }

    try {
      const user = await db.queryRow<{ full_name: string; phone_number: string }>`
        SELECT full_name, phone_number FROM users WHERE clerk_user_id = ${userId}
      `;

      await db.exec`DELETE FROM users WHERE clerk_user_id = ${userId}`;

      await logAuditAction({
        actionType: "DELETE",
        entityType: "USER",
        entityId: userId,
        oldValues: user ? { fullName: user.full_name, phoneNumber: user.phone_number } : undefined,
      }, _auditMetadata);

      return { success: true };
    } catch (err) {
      console.error("Delete user error:", err);
      throw APIError.internal("Failed to delete user", err as Error);
    }
  }
);
