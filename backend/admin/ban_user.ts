import { api, Header } from "encore.dev/api";
import { APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import { logAuditAction } from "../audit/logger";

export interface BanUserRequest {
  userId: string;
  reason: string;
  duration?: number;
}

export interface BanUserResponse {
  success: boolean;
  message: string;
}

export const banUser = api<BanUserRequest, BanUserResponse>(
  { expose: true, method: "POST", path: "/admin/users/ban", auth: true },
  async ({ userId, reason, duration }, ipAddress?: Header<"x-forwarded-for">, userAgent?: Header<"user-agent">) => {
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

    if (userCheck.is_banned) {
      throw APIError.invalidArgument("User sudah dalam status banned");
    }

    const bannedUntil = duration ? new Date(Date.now() + duration * 60 * 60 * 1000) : null;

    await db.exec`
      UPDATE users
      SET is_banned = true,
          ban_reason = ${reason},
          banned_at = NOW(),
          banned_until = ${bannedUntil},
          banned_by = ${auth.userID}
      WHERE clerk_user_id = ${userId}
    `;

    await logAuditAction({
      actionType: "BAN",
      entityType: "USER",
      entityId: userId,
      newValues: { reason, duration, bannedUntil: bannedUntil?.toISOString() },
    }, ipAddress, userAgent);

    console.log(`User ${userId} (${userCheck.full_name}) banned by ${auth.userID}. Reason: ${reason}`);

    return {
      success: true,
      message: `User ${userCheck.full_name} berhasil dibanned${duration ? ` selama ${duration} jam` : " secara permanen"}`,
    };
  }
);
