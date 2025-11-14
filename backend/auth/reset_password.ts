import { api } from "encore.dev/api";
import { APIError } from "encore.dev/api";
import db from "../db";
import bcrypt from "bcryptjs";

export interface ResetPasswordRequest {
  resetToken: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  success: boolean;
}

export const resetPassword = api<ResetPasswordRequest, ResetPasswordResponse>(
  { expose: true, method: "POST", path: "/auth/reset-password", auth: false },
  async ({ resetToken, newPassword }) => {
    console.log("Resetting password with token");

    let tokenData: { userId: string; email: string; timestamp: number };
    try {
      const decoded = Buffer.from(resetToken, "base64").toString("utf-8");
      tokenData = JSON.parse(decoded);
    } catch (err) {
      throw APIError.invalidArgument("Token reset tidak valid");
    }

    console.log("Token data:", { userId: tokenData.userId, email: tokenData.email });

    const tokenAge = Date.now() - tokenData.timestamp;
    const fifteenMinutes = 15 * 60 * 1000;
    
    if (tokenAge > fifteenMinutes) {
      throw APIError.permissionDenied("Token reset telah kadaluarsa. Silakan ulangi proses forgot password.");
    }

    if (newPassword.length < 6) {
      throw APIError.invalidArgument("Password minimal 6 karakter");
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    console.log("Updating password for user:", tokenData.userId);
    console.log("Password hash:", passwordHash.substring(0, 20) + "...");

    await db.exec`
      UPDATE users
      SET password_hash = ${passwordHash}
      WHERE clerk_user_id = ${tokenData.userId}
        AND email = ${tokenData.email}
    `;

    console.log("Password reset successful for user:", tokenData.userId);

    return { success: true };
  }
);
