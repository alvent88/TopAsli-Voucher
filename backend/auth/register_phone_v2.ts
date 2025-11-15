import { api } from "encore.dev/api";
import { APIError } from "encore.dev/api";
import db from "../db";
import bcrypt from "bcryptjs";
import { secret } from "encore.dev/config";

const fonnteToken = secret("FonnteToken");
import { generateToken } from "./custom_auth";
import { randomUUID } from "crypto";

export interface SendRegisterOTPRequest {
  phoneNumber: string;
}

export interface SendRegisterOTPResponse {
  success: boolean;
  message: string;
}

export const sendRegisterOTP = api<SendRegisterOTPRequest, SendRegisterOTPResponse>(
  { expose: true, method: "POST", path: "/auth/register/send-otp", auth: false },
  async ({ phoneNumber }) => {
    console.log("=== SEND REGISTER OTP ===");
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

    const existingUser = await db.queryRow<{ phone_number: string }>`
      SELECT phone_number FROM users WHERE phone_number = ${formattedPhone}
    `;

    if (existingUser) {
      throw APIError.alreadyExists(
        "Nomor HP ini sudah terdaftar. Silakan login atau gunakan nomor lain."
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const timestamp = Math.floor(Date.now() / 1000);

    await db.exec`
      INSERT INTO otp_codes (phone_number, otp_code, created_at, verified)
      VALUES (${phoneWithPrefix}, ${otp}, ${timestamp}, FALSE)
    `;

    const token = fonnteToken();
    
    if (!token || token === "") {
      throw APIError.failedPrecondition(
        "Fonnte Token belum dikonfigurasi. Silakan isi FonnteToken di Settings."
      );
    }

    const message = `🎉 *Selamat Datang di TopAsli!*\n\nKode OTP untuk registrasi:\n*${otp}*\n\nKode berlaku selama 5 menit.\n\n⚠️ Jangan berikan kode ini kepada siapapun!`;

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

export interface VerifyAndRegisterRequest {
  phoneNumber: string;
  otp: string;
  fullName: string;
  password: string;
  dateOfBirth: string;
}

export interface VerifyAndRegisterResponse {
  success: boolean;
  message: string;
  userId: string;
  phoneNumber: string;
  fullName: string;
  token: string;
}

export const verifyAndRegister = api<VerifyAndRegisterRequest, VerifyAndRegisterResponse>(
  { expose: true, method: "POST", path: "/auth/register/verify-and-create", auth: false },
  async ({ phoneNumber, otp, fullName, password, dateOfBirth }) => {
    console.log("=== VERIFY AND REGISTER ===");
    console.log("Phone:", phoneNumber);
    console.log("Name:", fullName);

    let formattedPhone = phoneNumber.replace(/\s/g, "").replace(/-/g, "");
    
    if (formattedPhone.startsWith("0")) {
      formattedPhone = formattedPhone.substring(1);
    } else if (formattedPhone.startsWith("62")) {
      formattedPhone = formattedPhone.substring(2);
    } else if (formattedPhone.startsWith("+62")) {
      formattedPhone = formattedPhone.substring(3);
    }

    const phoneWithPrefix = `62${formattedPhone}`;

    const existingUser = await db.queryRow<{ phone_number: string }>`
      SELECT phone_number FROM users WHERE phone_number = ${formattedPhone}
    `;

    if (existingUser) {
      throw APIError.alreadyExists("Nomor HP ini sudah terdaftar");
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
      throw APIError.invalidArgument("Kode OTP tidak ditemukan. Silakan kirim ulang OTP.");
    }

    if (otpRow.verified) {
      throw APIError.invalidArgument("Kode OTP sudah pernah digunakan. Silakan kirim ulang OTP.");
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const elapsedTime = currentTime - otpRow.created_at;

    if (elapsedTime > 300) {
      throw APIError.invalidArgument("Kode OTP sudah kadaluarsa. Silakan kirim ulang OTP.");
    }

    if (otpRow.otp_code !== otp) {
      throw APIError.invalidArgument("Kode OTP salah. Silakan coba lagi.");
    }

    await db.exec`
      UPDATE otp_codes
      SET verified = TRUE
      WHERE phone_number = ${phoneWithPrefix}
      AND otp_code = ${otp}
      AND verified = FALSE
    `;

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = randomUUID();

    console.log("Date of birth received:", dateOfBirth);

    await db.exec`
      INSERT INTO users (
        clerk_user_id, phone_number, full_name, password_hash, date_of_birth, created_at, updated_at
      ) VALUES (
        ${userId}, ${formattedPhone}, ${fullName}, ${passwordHash}, ${dateOfBirth}::date, NOW(), NOW()
      )
    `;

    await db.exec`
      INSERT INTO user_balance (user_id, balance)
      VALUES (${userId}, 0)
      ON CONFLICT (user_id) DO NOTHING
    `;

    console.log("User created successfully:", userId);

    const token = generateToken(userId, phoneWithPrefix, fullName);

    return {
      success: true,
      message: "Registrasi berhasil!",
      userId,
      phoneNumber: phoneWithPrefix,
      fullName,
      token,
    };
  }
);
