import { api } from "encore.dev/api";
import { APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

export interface UnbanUserRequest {
  userId: string;
}

export interface UnbanUserResponse {
  success: boolean;
  message: string;
}

export const unbanUser = api<UnbanUserRequest, UnbanUserResponse>(
  { expose: true, method: "POST", path: "/admin/users/unban", auth: true },
  async ({ userId }) => {
    const auth = getAuthData();
    if (!auth || !auth.isSuperAdmin) {
      throw APIError.permissionDenied("Superadmin access required");
    }

    const userCheck = await db.queryRow<{
      clerk_user_id: string;
      is_banned: boolean;
      full_name: string;
    }>`
      SELECT clerk_user_id, is_banned, full_name
      FROM users
      WHERE clerk_user_id = ${userId}
    `;

    if (!userCheck) {
      throw APIError.notFound("User tidak ditemukan");
    }

    if (!userCheck.is_banned) {
      throw APIError.invalidArgument("User tidak dalam status banned");
    }

    await db.exec`
      UPDATE users
      SET is_banned = false,
          ban_reason = NULL,
          banned_at = NULL,
          banned_until = NULL,
          banned_by = NULL
      WHERE clerk_user_id = ${userId}
    `;

    console.log(`User ${userId} (${userCheck.full_name}) unbanned by superadmin ${auth.userID}`);

    return {
      success: true,
      message: `User ${userCheck.full_name} berhasil di-unban`,
    };
  }
);
