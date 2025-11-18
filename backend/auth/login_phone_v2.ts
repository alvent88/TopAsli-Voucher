import { api, APIError } from "encore.dev/api";
import db from "../db";
import bcrypt from "bcryptjs";
import { generateToken } from "./custom_auth";

export interface LoginPhoneV2Request {
  phoneNumber: string;
  password: string;
}

export interface LoginPhoneV2Response {
  success: boolean;
  message: string;
  userId: string;
  phoneNumber: string;
  fullName: string;
  token: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

export const loginPhoneV2 = api<LoginPhoneV2Request, LoginPhoneV2Response>(
  { expose: true, method: "POST", path: "/auth/login-phone-v2", auth: false },
  async ({ phoneNumber, password }) => {
    console.log("=== LOGIN PHONE V2 START ===");
    console.log("Phone:", phoneNumber);

    let formattedPhone = phoneNumber.replace(/\s/g, "").replace(/-/g, "");
    
    if (formattedPhone.startsWith("0")) {
      formattedPhone = formattedPhone.substring(1);
    } else if (formattedPhone.startsWith("62")) {
      formattedPhone = formattedPhone.substring(2);
    } else if (formattedPhone.startsWith("+62")) {
      formattedPhone = formattedPhone.substring(3);
    }

    const phoneWithPrefix = `62${formattedPhone}`;

    const user = await db.queryRow<{ 
      clerk_user_id: string;
      phone_number: string;
      password_hash: string;
      full_name: string;
      is_banned: boolean;
      ban_reason: string | null;
      banned_until: Date | null;
      is_admin: boolean;
      is_superadmin: boolean;
    }>`
      SELECT clerk_user_id, phone_number, password_hash, full_name, 
             is_banned, ban_reason, banned_until, is_admin, is_superadmin
      FROM users 
      WHERE phone_number = ${phoneWithPrefix}
    `;

    if (!user) {
      throw APIError.unauthenticated("Nomor HP atau password salah");
    }

    if (user.is_banned) {
      const now = new Date();
      if (user.banned_until && user.banned_until > now) {
        const remainingMinutes = Math.ceil((user.banned_until.getTime() - now.getTime()) / 60000);
        throw APIError.permissionDenied(
          `Akun Anda telah dibanned. Alasan: ${user.ban_reason || "Brute force voucher attempts"}. Silakan coba lagi dalam ${remainingMinutes} menit.`
        );
      } else if (user.banned_until && user.banned_until <= now) {
        await db.exec`
          UPDATE users
          SET is_banned = false,
              ban_reason = NULL,
              banned_at = NULL,
              banned_until = NULL,
              banned_by = NULL
          WHERE clerk_user_id = ${user.clerk_user_id}
        `;
        console.log("Auto-unban user after expiry:", user.clerk_user_id);
      } else {
        throw APIError.permissionDenied(
          `Akun Anda telah dibanned secara permanen. Alasan: ${user.ban_reason || "Tidak ada alasan yang diberikan"}. Hubungi admin untuk unban.`
        );
      }
    }

    if (!user.password_hash) {
      throw APIError.unauthenticated(
        "Akun Anda belum memiliki password. Silakan reset password."
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      throw APIError.unauthenticated("Nomor HP atau password salah");
    }

    console.log("Login successful for user:", user.clerk_user_id);

    const balanceExists = await db.queryRow<{ exists: boolean }>`
      SELECT EXISTS(SELECT 1 FROM user_balance WHERE user_id = ${user.clerk_user_id}) as exists
    `;

    if (!balanceExists?.exists) {
      console.log("Creating user_balance for user:", user.clerk_user_id);
      await db.exec`
        INSERT INTO user_balance (user_id, balance)
        VALUES (${user.clerk_user_id}, 0)
        ON CONFLICT (user_id) DO NOTHING
      `;
    }

    console.log("=== LOGIN PHONE V2 SUCCESS ===");

    const token = generateToken(user.clerk_user_id, user.phone_number, user.full_name);

    return {
      success: true,
      message: "Login berhasil!",
      userId: user.clerk_user_id,
      phoneNumber: user.phone_number,
      fullName: user.full_name,
      token,
      isAdmin: user.is_admin || false,
      isSuperAdmin: user.is_superadmin || false,
    };
  }
);
