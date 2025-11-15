import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import db from "../db";
import { secret } from "encore.dev/config";

const fonnteToken = secret("FonnteToken");

export interface SendChangePasswordOTPResponse {
  success: boolean;
  message: string;
}

export const sendChangePasswordOTP = api<void, SendChangePasswordOTPResponse>(
  { expose: true, method: "POST", path: "/auth/send-change-password-otp", auth: true },
  async () => {
    const auth = getAuthData();
    
    if (!auth || !auth.userID) {
      throw APIError.unauthenticated("User not authenticated");
    }

    console.log("=== SEND CHANGE PASSWORD OTP START ===");
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

      console.log("Formatted phone:", formattedPhone);

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const timestamp = Math.floor(Date.now() / 1000);
      
      console.log("Generated OTP:", otp);
      console.log("Timestamp:", timestamp);

      await db.exec`
        INSERT INTO otp_codes (phone_number, otp_code, created_at, verified)
        VALUES (${formattedPhone}, ${otp}, ${timestamp}, FALSE)
      `;
      
      console.log("OTP saved to database");

      const token = fonnteToken();
      
      if (!token || token === "") {
        throw APIError.failedPrecondition("Fonnte Token belum dikonfigurasi. Silakan isi FonnteToken di Settings.");
      }

      const message = `🔐 *Kode OTP Ganti Password TopAsli*\n\nKode verifikasi untuk mengganti password Anda:\n*${otp}*\n\nKode berlaku selama 5 menit.\n\n⚠️ Jangan berikan kode ini kepada siapapun!`;

      console.log("Sending to Fonnte API...");
      console.log("Target:", formattedPhone);

      const formData = new URLSearchParams();
      formData.append('target', formattedPhone);
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

      console.log("=== FONNTE API RESPONSE ===");
      console.log("Status:", response.status);
      console.log("Response data:", JSON.stringify(data, null, 2));

      const responseData = data as any;
      if (!response.ok || responseData.status === false) {
        console.error("Fonnte error reason:", responseData.reason);
        throw APIError.internal(responseData.reason || "Gagal mengirim OTP via WhatsApp. Periksa Fonnte Token.");
      }

      console.log("=== SEND CHANGE PASSWORD OTP SUCCESS ===");

      return {
        success: true,
        message: "Kode OTP telah dikirim ke WhatsApp Anda",
      };
    } catch (err: any) {
      console.error("=== SEND CHANGE PASSWORD OTP ERROR ===");
      console.error("Error:", err);
      
      if (err instanceof APIError) {
        throw err;
      }
      
      throw APIError.internal(err.message || "Gagal mengirim OTP");
    }
  }
);
