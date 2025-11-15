import { api } from "encore.dev/api";
import { APIError } from "encore.dev/api";
import db from "../db";
import bcrypt from "bcryptjs";
import { secret } from "encore.dev/config";
import { Header } from "encore.dev/api";
import { checkPhoneRateLimit, checkIPRateLimit, recordOTPRequest, logSuspiciousActivity } from "../otp/rate_limiter";
import { checkAndLogBruteForceOTP, checkAndLogMultipleIPActivity } from "../otp/security_logger";

const fonnteToken = secret("FonnteToken");

export interface SendForgotPasswordPhoneOTPRequest {
  phoneNumber: string;
  xForwardedFor?: Header<"x-forwarded-for">;
  userAgent?: Header<"user-agent">;
}

export interface SendForgotPasswordPhoneOTPResponse {
  success: boolean;
  message: string;
}

export const sendForgotPasswordPhoneOTP = api<SendForgotPasswordPhoneOTPRequest, SendForgotPasswordPhoneOTPResponse>(
  { expose: true, method: "POST", path: "/auth/forgot-password-phone/send-otp", auth: false },
  async ({ phoneNumber, xForwardedFor, userAgent }) => {
    console.log("=== FORGOT PASSWORD PHONE: SEND OTP ===");
    console.log("Phone:", phoneNumber);

    const ipAddress = xForwardedFor || null;
    const userAgentStr = userAgent || null;
    console.log("IP Address:", ipAddress);
    console.log("User Agent:", userAgentStr);

    let formattedPhone = phoneNumber.replace(/\s/g, "").replace(/-/g, "");
    
    if (formattedPhone.startsWith("0")) {
      formattedPhone = formattedPhone.substring(1);
    } else if (formattedPhone.startsWith("62")) {
      formattedPhone = formattedPhone.substring(2);
    } else if (formattedPhone.startsWith("+62")) {
      formattedPhone = formattedPhone.substring(3);
    }

    const phoneWithPrefix = `62${formattedPhone}`;

    await checkPhoneRateLimit(phoneWithPrefix);
    if (ipAddress) {
      await checkIPRateLimit(ipAddress);
    }

    await checkAndLogMultipleIPActivity(phoneWithPrefix, ipAddress);

    const user = await db.queryRow<{ 
      clerk_user_id: string;
      phone_number: string;
    }>`
      SELECT clerk_user_id, phone_number
      FROM users
      WHERE phone_number = ${formattedPhone}
    `;

    if (!user) {
      throw APIError.notFound("Nomor HP tidak terdaftar");
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const timestamp = Math.floor(Date.now() / 1000);
    
    console.log("Generated OTP:", otp);

    await db.exec`
      INSERT INTO otp_codes (phone_number, otp_code, created_at, verified, ip_address, user_agent)
      VALUES (${phoneWithPrefix}, ${otp}, ${timestamp}, FALSE, ${ipAddress}, ${userAgentStr})
    `;

    await recordOTPRequest(phoneWithPrefix, ipAddress, userAgentStr);

    const token = fonnteToken();

    if (!token || token === "") {
      throw APIError.failedPrecondition(
        "Fonnte Token belum dikonfigurasi. Silakan isi FonnteToken di Settings."
      );
    }

    const message = `🔐 *Reset Password TopAsli*\n\nKode OTP untuk reset password:\n*${otp}*\n\nKode berlaku selama 5 menit.\n\n⚠️ Jangan berikan kode ini kepada siapapun!`;

    const formData = new URLSearchParams();
    formData.append('target', phoneWithPrefix);
    formData.append('message', message);
    formData.append('countryCode', '0');

    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const data = await response.json();
    console.log("Fonnte response:", data);

    const responseData = data as any;
    if (!response.ok || responseData.status === false) {
      await logSuspiciousActivity(phoneWithPrefix, ipAddress, `Fonnte send failed: ${responseData.reason}`);
      throw APIError.internal(
        responseData.reason || "Gagal mengirim OTP via WhatsApp"
      );
    }

    return {
      success: true,
      message: "Kode OTP telah dikirim ke WhatsApp Anda",
    };
  }
);

export interface VerifyForgotPasswordPhoneOTPRequest {
  phoneNumber: string;
  otp: string;
}

export interface VerifyForgotPasswordPhoneOTPResponse {
  verified: boolean;
  resetToken: string;
}

export const verifyForgotPasswordPhoneOTP = api<VerifyForgotPasswordPhoneOTPRequest, VerifyForgotPasswordPhoneOTPResponse>(
  { expose: true, method: "POST", path: "/auth/forgot-password-phone/verify-otp", auth: false },
  async ({ phoneNumber, otp }) => {
    console.log("=== FORGOT PASSWORD PHONE: VERIFY OTP ===");

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
    }>`
      SELECT clerk_user_id, phone_number
      FROM users
      WHERE phone_number = ${formattedPhone}
    `;

    if (!user) {
      throw APIError.notFound("Nomor HP tidak terdaftar");
    }

    const otpRow = await db.queryRow<{ 
      otp_code: string; 
      created_at: number; 
      verified: boolean 
    }>`
      SELECT otp_code, created_at, verified
      FROM otp_codes
      WHERE phone_number = ${phoneWithPrefix}
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (!otpRow) {
      throw APIError.invalidArgument("Kode OTP tidak ditemukan");
    }

    if (otpRow.verified) {
      throw APIError.invalidArgument("Kode OTP sudah pernah digunakan");
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const elapsedTime = currentTime - otpRow.created_at;

    if (elapsedTime > 300) {
      throw APIError.invalidArgument("Kode OTP sudah kadaluarsa (lebih dari 5 menit)");
    }

    if (otpRow.otp_code !== otp) {
      await checkAndLogBruteForceOTP(phoneWithPrefix, null);
      throw APIError.invalidArgument("Kode OTP salah");
    }

    await db.exec`
      UPDATE otp_codes
      SET verified = TRUE
      WHERE phone_number = ${phoneWithPrefix}
      AND otp_code = ${otp}
      AND verified = FALSE
    `;

    const resetToken = Buffer.from(
      JSON.stringify({
        userId: user.clerk_user_id,
        phoneNumber: user.phone_number,
        timestamp: Date.now(),
      })
    ).toString("base64");

    return {
      verified: true,
      resetToken,
    };
  }
);

export interface ResetPasswordPhoneRequest {
  resetToken: string;
  newPassword: string;
}

export interface ResetPasswordPhoneResponse {
  success: boolean;
}

export const resetPasswordPhone = api<ResetPasswordPhoneRequest, ResetPasswordPhoneResponse>(
  { expose: true, method: "POST", path: "/auth/reset-password-phone", auth: false },
  async ({ resetToken, newPassword }) => {
    console.log("=== RESET PASSWORD PHONE ===");

    let tokenData: { userId: string; phoneNumber: string; timestamp: number };
    try {
      const decoded = Buffer.from(resetToken, "base64").toString("utf-8");
      tokenData = JSON.parse(decoded);
    } catch (err) {
      throw APIError.invalidArgument("Token reset tidak valid");
    }

    const tokenAge = Date.now() - tokenData.timestamp;
    const fifteenMinutes = 15 * 60 * 1000;
    
    if (tokenAge > fifteenMinutes) {
      throw APIError.permissionDenied("Token reset telah kadaluarsa. Silakan ulangi proses forgot password.");
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    console.log("Updating password for user:", tokenData.userId);

    await db.exec`
      UPDATE users
      SET password_hash = ${passwordHash}, updated_at = NOW()
      WHERE clerk_user_id = ${tokenData.userId}
        AND phone_number = ${tokenData.phoneNumber}
    `;

    console.log("Password reset successful for user:", tokenData.userId);

    return { success: true };
  }
);
