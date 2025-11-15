import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import db from "../db";
import bcrypt from "bcryptjs";

export interface ChangePasswordRequest {
  newPassword: string;
  otp: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

export const changePassword = api<ChangePasswordRequest, ChangePasswordResponse>(
  { expose: true, method: "POST", path: "/auth/change-password", auth: true },
  async ({ newPassword, otp }) => {
    const auth = getAuthData();
    
    if (!auth || !auth.userID) {
      throw APIError.unauthenticated("User not authenticated");
    }

    console.log("=== CHANGE PASSWORD START ===");
    console.log("User ID:", auth.userID);

    try {
      const user = await db.queryRow<{ phone_number: string | null }>`
        SELECT phone_number FROM users WHERE clerk_user_id = ${auth.userID}
      `;

      if (!user || !user.phone_number) {
        throw APIError.notFound("User tidak ditemukan atau nomor HP tidak terdaftar");
      }

      let formattedPhone = user.phone_number;
      if (!formattedPhone.startsWith('62')) {
        if (formattedPhone.startsWith('0')) {
          formattedPhone = '62' + formattedPhone.substring(1);
        } else {
          formattedPhone = '62' + formattedPhone;
        }
      }

      console.log("Formatted phone for OTP verification:", formattedPhone);

      const otpRow = await db.queryRow<{ otp_code: string; created_at: number; verified: boolean }>`
        SELECT otp_code, created_at, verified
        FROM otp_codes
        WHERE phone_number = ${formattedPhone}
        ORDER BY created_at DESC
        LIMIT 1
      `;

      if (!otpRow) {
        throw APIError.invalidArgument("Kode OTP tidak ditemukan. Silakan kirim ulang OTP.");
      }

      if (otpRow.verified) {
        throw APIError.invalidArgument("Kode OTP sudah pernah digunakan. Silakan kirim ulang OTP.");
      }

      const currentTime = Math.floor(Date.now() / 1000);
      const elapsedTime = currentTime - otpRow.created_at;

      if (elapsedTime > 300) {
        throw APIError.invalidArgument("Kode OTP sudah kadaluarsa (lebih dari 5 menit). Silakan kirim ulang OTP.");
      }

      if (otpRow.otp_code !== otp) {
        throw APIError.invalidArgument("Kode OTP salah. Silakan coba lagi.");
      }

      await db.exec`
        UPDATE otp_codes
        SET verified = TRUE
        WHERE phone_number = ${formattedPhone}
        AND otp_code = ${otp}
        AND verified = FALSE
      `;

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await db.exec`
        UPDATE users
        SET password_hash = ${hashedPassword},
            updated_at = NOW()
        WHERE clerk_user_id = ${auth.userID}
      `;

      console.log("Password changed successfully");

      return {
        success: true,
        message: "Password berhasil diubah",
      };
    } catch (err: any) {
      console.error("=== CHANGE PASSWORD ERROR ===");
      console.error("Error:", err);
      
      if (err instanceof APIError) {
        throw err;
      }
      
      throw APIError.internal(err.message || "Gagal mengubah password");
    }
  }
);
