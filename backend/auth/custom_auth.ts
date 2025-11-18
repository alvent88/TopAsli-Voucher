import { Header, APIError, Gateway } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";
import db from "../db";

interface AuthParams {
  authorization?: Header<"Authorization">;
}

export interface AuthData {
  userID: string;
  phoneNumber: string;
  fullName: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

export const auth = authHandler<AuthParams, AuthData>(async (data) => {
  const authHeader = data.authorization;
  
  if (!authHeader) {
    throw APIError.unauthenticated("missing authorization header");
  }

  const parts = authHeader.split(" ");
  
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    throw APIError.unauthenticated("invalid authorization format");
  }

  const token = parts[1];
  
  const decoded = parseToken(token);
  
  if (!decoded) {
    throw APIError.unauthenticated("invalid token");
  }

  const userBanCheck = await db.queryRow<{
    is_banned: boolean;
    ban_reason: string | null;
    banned_until: Date | null;
    is_admin: boolean;
    is_superadmin: boolean;
  }>`
    SELECT is_banned, ban_reason, banned_until, is_admin, is_superadmin
    FROM users
    WHERE clerk_user_id = ${decoded.userId}
  `;

  if (userBanCheck?.is_banned) {
    const now = new Date();
    if (userBanCheck.banned_until && userBanCheck.banned_until > now) {
      const remainingMinutes = Math.ceil((userBanCheck.banned_until.getTime() - now.getTime()) / 60000);
      throw APIError.permissionDenied(
        `Akun Anda telah dibanned. Alasan: ${userBanCheck.ban_reason || "Brute force voucher attempts"}. Silakan coba lagi dalam ${remainingMinutes} menit.`
      );
    } else if (userBanCheck.banned_until && userBanCheck.banned_until <= now) {
      await db.exec`
        UPDATE users
        SET is_banned = false,
            ban_reason = NULL,
            banned_at = NULL,
            banned_until = NULL,
            banned_by = NULL
        WHERE clerk_user_id = ${decoded.userId}
      `;
      console.log("Auto-unban user after expiry:", decoded.userId);
    } else {
      throw APIError.permissionDenied(
        `Akun Anda telah dibanned secara permanen. Alasan: ${userBanCheck.ban_reason || "Tidak ada alasan yang diberikan"}. Hubungi admin untuk unban.`
      );
    }
  }

  const isAdmin = userBanCheck?.is_admin || false;
  const isSuperAdmin = userBanCheck?.is_superadmin || false;

  return {
    userID: decoded.userId,
    phoneNumber: decoded.phoneNumber,
    fullName: decoded.fullName,
    isAdmin: isAdmin,
    isSuperAdmin: isSuperAdmin,
  };
});

export const gw = new Gateway({ authHandler: auth });

function parseToken(token: string): { userId: string; phoneNumber: string; fullName: string } | null {
  try {
    const payload = Buffer.from(token, "base64").toString("utf-8");
    const data = JSON.parse(payload);
    
    if (!data.userId || !data.phoneNumber) {
      return null;
    }
    
    return {
      userId: data.userId,
      phoneNumber: data.phoneNumber,
      fullName: data.fullName || "",
    };
  } catch {
    return null;
  }
}

export function generateToken(userId: string, phoneNumber: string, fullName: string): string {
  const payload = JSON.stringify({ userId, phoneNumber, fullName });
  return Buffer.from(payload).toString("base64");
}
