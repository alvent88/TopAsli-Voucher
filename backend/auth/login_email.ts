import { api, APIError } from "encore.dev/api";
import db from "../db";

export interface LoginEmailRequest {
  email: string;
  password: string;
}

export interface LoginEmailResponse {
  success: boolean;
  message: string;
  userId: string;
  email: string;
  fullName: string;
}

export const loginEmail = api<LoginEmailRequest, LoginEmailResponse>(
  { expose: true, method: "POST", path: "/auth/login-email", auth: false },
  async ({ email, password }) => {
    try {
      console.log("=== LOGIN EMAIL START ===");
      console.log("Email:", email);
      
      const user = await db.queryRow<{ 
        clerk_user_id: string;
        email: string;
        password_hash: string;
        full_name: string;
      }>`
        SELECT clerk_user_id, email, password_hash, full_name
        FROM users 
        WHERE email = ${email}
      `;
      
      if (!user) {
        throw APIError.unauthenticated(
          "Email atau password salah"
        );
      }
      
      if (!user.password_hash) {
        throw APIError.unauthenticated(
          "Akun Anda belum memiliki password. Silakan reset password."
        );
      }
      
      const isPasswordValid = await Bun.password.verify(password, user.password_hash);
      
      if (!isPasswordValid) {
        throw APIError.unauthenticated(
          "Email atau password salah"
        );
      }
      
      console.log("Login successful for user:", user.clerk_user_id);
      console.log("=== LOGIN EMAIL SUCCESS ===");

      return {
        success: true,
        message: "Login berhasil!",
        userId: user.clerk_user_id,
        email: user.email,
        fullName: user.full_name,
      };
    } catch (err: any) {
      console.error("=== LOGIN EMAIL ERROR ===");
      console.error("Error:", err);
      
      if (err instanceof APIError) {
        throw err;
      }
      
      throw APIError.internal(err.message || "Gagal melakukan login");
    }
  }
);
