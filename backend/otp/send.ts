import { api } from "encore.dev/api";
import { APIError } from "encore.dev/api";
import db from "../db";
import { createClerkClient } from "@clerk/backend";
import { secret } from "encore.dev/config";

const clerkSecretKey = secret("ClerkSecretKey");
const clerkClient = createClerkClient({ secretKey: clerkSecretKey() });

const fonnteToken = secret("FonnteToken");

export interface SendOTPRequest {
  phoneNumber: string;
}

export interface SendOTPResponse {
  success: boolean;
  message: string;
}

export const sendOTP = api<SendOTPRequest, SendOTPResponse>(
  { expose: true, method: "POST", path: "/otp/send" },
  async ({ phoneNumber }) => {
    try {
      console.log("=== SEND OTP START ===");
      console.log("Raw phone number:", phoneNumber);
      
      let formattedPhone = phoneNumber.replace(/\s/g, "").replace(/-/g, "");
      
      if (formattedPhone.startsWith("0")) {
        formattedPhone = "62" + formattedPhone.substring(1);
      } else if (formattedPhone.startsWith("+")) {
        formattedPhone = formattedPhone.substring(1);
      } else if (!formattedPhone.startsWith("62")) {
        formattedPhone = "62" + formattedPhone;
      }

      console.log("Formatted phone:", formattedPhone);

      // Check if phone number already exists in Clerk
      try {
        const users = await clerkClient.users.getUserList({
          phoneNumber: [`+${formattedPhone}`],
        });
        
        console.log("Clerk users found:", users.data.length);
        
        if (users.data.length > 0) {
          throw APIError.alreadyExists(
            "Nomor HP ini sudah terdaftar. Silakan gunakan nomor lain atau login jika sudah punya akun."
          );
        }
      } catch (clerkError: any) {
        if (clerkError instanceof APIError) {
          throw clerkError;
        }
        console.error("Clerk check error (non-critical):", clerkError);
      }

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
      
      console.log("Using Fonnte token (first 10 chars):", token.substring(0, 10) + "...");

      const message = `🔐 *Kode OTP TopAsli*\n\nKode verifikasi Anda:\n*${otp}*\n\nKode berlaku selama 5 menit.\n\n⚠️ Jangan berikan kode ini kepada siapapun!`;

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

      console.log("=== SEND OTP SUCCESS ===");

      return {
        success: true,
        message: "Kode OTP telah dikirim ke WhatsApp Anda",
      };
    } catch (err: any) {
      console.error("=== SEND OTP ERROR ===");
      console.error("Error:", err);
      console.error("Error message:", err.message);
      
      if (err instanceof APIError) {
        throw err;
      }
      
      throw APIError.internal(err.message || "Gagal mengirim OTP", err);
    }
  }
);

export interface VerifyOTPRequest {
  phoneNumber: string;
  otp: string;
}

export interface VerifyOTPResponse {
  success: boolean;
  message: string;
}

export const verifyOTP = api<VerifyOTPRequest, VerifyOTPResponse>(
  { expose: true, method: "POST", path: "/otp/verify" },
  async ({ phoneNumber, otp }) => {
    try {
      let formattedPhone = phoneNumber.replace(/\s/g, "").replace(/-/g, "");
      
      if (formattedPhone.startsWith("0")) {
        formattedPhone = "62" + formattedPhone.substring(1);
      } else if (formattedPhone.startsWith("+")) {
        formattedPhone = formattedPhone.substring(1);
      } else if (!formattedPhone.startsWith("62")) {
        formattedPhone = "62" + formattedPhone;
      }

      const row = await db.queryRow<{ otp_code: string; created_at: number; verified: boolean }>`
        SELECT otp_code, created_at, verified
        FROM otp_codes
        WHERE phone_number = ${formattedPhone}
        ORDER BY created_at DESC
        LIMIT 1
      `;

      if (!row) {
        throw APIError.invalidArgument("Kode OTP tidak ditemukan. Silakan kirim ulang OTP.");
      }

      if (row.verified) {
        throw APIError.invalidArgument("Kode OTP sudah pernah digunakan. Silakan kirim ulang OTP.");
      }

      const currentTime = Math.floor(Date.now() / 1000);
      const elapsedTime = currentTime - row.created_at;

      if (elapsedTime > 300) {
        throw APIError.invalidArgument("Kode OTP sudah kadaluarsa (lebih dari 5 menit). Silakan kirim ulang OTP.");
      }

      if (row.otp_code !== otp) {
        throw APIError.invalidArgument("Kode OTP salah. Silakan coba lagi.");
      }

      await db.exec`
        UPDATE otp_codes
        SET verified = TRUE
        WHERE phone_number = ${formattedPhone}
        AND otp_code = ${otp}
        AND verified = FALSE
      `;

      return {
        success: true,
        message: "Verifikasi OTP berhasil!",
      };
    } catch (err: any) {
      console.error("Verify OTP error:", err);
      
      if (err instanceof APIError) {
        throw err;
      }
      
      throw APIError.internal(err.message || "Gagal memverifikasi OTP", err);
    }
  }
);
