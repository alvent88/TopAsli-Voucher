import { api } from "encore.dev/api";
import { APIError } from "encore.dev/api";
import db from "../db";

export interface SendForgotPasswordOTPRequest {
  email: string;
  phoneNumber: string;
}

export interface SendForgotPasswordOTPResponse {
  success: boolean;
  message: string;
}

export const sendForgotPasswordOTP = api<SendForgotPasswordOTPRequest, SendForgotPasswordOTPResponse>(
  { expose: true, method: "POST", path: "/auth/forgot-password/send-otp", auth: false },
  async ({ email, phoneNumber }) => {
    console.log("=== FORGOT PASSWORD: SEND OTP ===");
    console.log("Email:", email);
    console.log("Phone:", phoneNumber);

    let formattedPhone = phoneNumber.replace(/\s/g, "").replace(/-/g, "");
    
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "62" + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith("+")) {
      formattedPhone = formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith("62")) {
      formattedPhone = "62" + formattedPhone;
    }

    const user = await db.queryRow<{ 
      clerk_user_id: string;
      email: string;
      phone_number: string | null;
    }>`
      SELECT clerk_user_id, email, phone_number
      FROM users
      WHERE email = ${email}
    `;

    if (!user) {
      throw APIError.notFound("Email tidak terdaftar");
    }

    if (!user.phone_number) {
      throw APIError.invalidArgument(
        "Akun Anda tidak memiliki nomor HP terdaftar. Silakan hubungi customer service."
      );
    }

    const dbFormattedPhone = user.phone_number.replace(/\s/g, "").replace(/-/g, "");
    const dbPhone = dbFormattedPhone.startsWith("0") 
      ? "62" + dbFormattedPhone.substring(1) 
      : dbFormattedPhone.startsWith("+")
      ? dbFormattedPhone.substring(1)
      : dbFormattedPhone.startsWith("62")
      ? dbFormattedPhone
      : "62" + dbFormattedPhone;

    if (formattedPhone !== dbPhone) {
      throw APIError.permissionDenied("Nomor HP tidak sesuai dengan data akun Anda");
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const timestamp = Math.floor(Date.now() / 1000);
    
    console.log("Generated OTP:", otp);

    await db.exec`
      INSERT INTO otp_codes (phone_number, otp_code, created_at, verified)
      VALUES (${formattedPhone}, ${otp}, ${timestamp}, FALSE)
    `;

    const configRow = await db.queryRow<{ value: string }>`
      SELECT value FROM admin_config WHERE key = 'dashboard_config'
    `;

    let fonnteToken = "";
    if (configRow) {
      const config = JSON.parse(configRow.value);
      fonnteToken = config.whatsapp?.fonnteToken || "";
    }

    if (!fonnteToken || fonnteToken === "") {
      throw APIError.failedPrecondition(
        "WhatsApp API belum dikonfigurasi. Silakan hubungi administrator."
      );
    }

    const message = `🔐 *Reset Password TopAsli*\n\nKode OTP untuk reset password:\n*${otp}*\n\nKode berlaku selama 5 menit.\n\n⚠️ Jangan berikan kode ini kepada siapapun!`;

    const formData = new URLSearchParams();
    formData.append('target', formattedPhone);
    formData.append('message', message);
    formData.append('countryCode', '0');

    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': fonnteToken,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const data = await response.json();
    console.log("Fonnte response:", data);

    const responseData = data as any;
    if (!response.ok || responseData.status === false) {
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

export interface VerifyForgotPasswordOTPRequest {
  email: string;
  phoneNumber: string;
  otp: string;
}

export interface VerifyForgotPasswordOTPResponse {
  verified: boolean;
  resetToken: string;
}

export const verifyForgotPasswordOTP = api<VerifyForgotPasswordOTPRequest, VerifyForgotPasswordOTPResponse>(
  { expose: true, method: "POST", path: "/auth/forgot-password/verify-otp", auth: false },
  async ({ email, phoneNumber, otp }) => {
    console.log("=== FORGOT PASSWORD: VERIFY OTP ===");

    let formattedPhone = phoneNumber.replace(/\s/g, "").replace(/-/g, "");
    
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "62" + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith("+")) {
      formattedPhone = formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith("62")) {
      formattedPhone = "62" + formattedPhone;
    }

    const user = await db.queryRow<{ 
      clerk_user_id: string;
      email: string;
      phone_number: string | null;
    }>`
      SELECT clerk_user_id, email, phone_number
      FROM users
      WHERE email = ${email}
    `;

    if (!user) {
      throw APIError.notFound("Email tidak terdaftar");
    }

    const otpRow = await db.queryRow<{ 
      otp_code: string; 
      created_at: number; 
      verified: boolean 
    }>`
      SELECT otp_code, created_at, verified
      FROM otp_codes
      WHERE phone_number = ${formattedPhone}
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
      throw APIError.invalidArgument("Kode OTP salah");
    }

    await db.exec`
      UPDATE otp_codes
      SET verified = TRUE
      WHERE phone_number = ${formattedPhone}
      AND otp_code = ${otp}
      AND verified = FALSE
    `;

    const resetToken = Buffer.from(
      JSON.stringify({
        userId: user.clerk_user_id,
        email: user.email,
        timestamp: Date.now(),
      })
    ).toString("base64");

    return {
      verified: true,
      resetToken,
    };
  }
);
