import { api } from "encore.dev/api";
import { APIError } from "encore.dev/api";
import db from "../db";

export interface RegisterEmailRequest {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  birthDate: string;
}

export interface RegisterEmailResponse {
  success: boolean;
  message: string;
}

export const registerEmail = api<RegisterEmailRequest, RegisterEmailResponse>(
  { expose: true, method: "POST", path: "/auth/register-email", auth: false },
  async ({ email, password, fullName, phoneNumber, birthDate }) => {
    try {
      console.log("=== REGISTER WITHOUT OTP START ===");
      console.log("Email:", email);
      console.log("Full name:", fullName);
      console.log("Phone number:", phoneNumber);
      console.log("Birth date:", birthDate);
      
      const timestamp = Math.floor(Date.now() / 1000);
      
      const existingUser = await db.queryRow<{ clerk_user_id: string }>`
        SELECT clerk_user_id FROM users WHERE email = ${email}
      `;
      
      if (existingUser) {
        throw APIError.alreadyExists(
          "Email sudah terdaftar. Silakan login atau gunakan email lain."
        );
      }
      
      const existingPhone = await db.queryRow<{ phone_number: string }>`
        SELECT phone_number FROM users WHERE phone_number = ${phoneNumber}
      `;
      
      if (existingPhone) {
        throw APIError.alreadyExists(
          "Nomor WhatsApp sudah terdaftar. Silakan gunakan nomor lain."
        );
      }
      
      const passwordHash = await Bun.password.hash(password, {
        algorithm: "bcrypt",
        cost: 10
      });
      
      const generatedUserId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      
      await db.exec`
        INSERT INTO users (
          clerk_user_id, email, password_hash, full_name, phone_number, birth_date, created_at, updated_at
        )
        VALUES (
          ${generatedUserId}, ${email}, ${passwordHash}, ${fullName}, ${phoneNumber}, ${birthDate}, ${timestamp}, ${timestamp}
        )
      `;
      
      console.log("User registered successfully");
      console.log("=== REGISTER WITHOUT OTP SUCCESS ===");

      return {
        success: true,
        message: "Registrasi berhasil! Silakan login dengan email Anda.",
      };
    } catch (err: any) {
      console.error("=== REGISTER WITHOUT OTP ERROR ===");
      console.error("Error:", err);
      
      if (err instanceof APIError) {
        throw err;
      }
      
      throw APIError.internal(err.message || "Gagal melakukan registrasi");
    }
  }
);
