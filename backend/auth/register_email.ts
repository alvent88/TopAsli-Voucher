import { api } from "encore.dev/api";
import { APIError } from "encore.dev/api";
import db from "../db";

export interface RegisterEmailRequest {
  email: string;
  fullName: string;
  clerkUserId: string;
}

export interface RegisterEmailResponse {
  success: boolean;
  message: string;
}

export const registerEmail = api<RegisterEmailRequest, RegisterEmailResponse>(
  { expose: true, method: "POST", path: "/auth/register-email" },
  async ({ email, fullName, clerkUserId }) => {
    try {
      console.log("=== REGISTER EMAIL START ===");
      console.log("Email:", email);
      console.log("Full name:", fullName);
      console.log("Clerk User ID:", clerkUserId);
      
      const timestamp = Math.floor(Date.now() / 1000);
      
      // Check if email already registered
      const existing = await db.queryRow<{ email: string }>`
        SELECT email FROM email_registrations WHERE email = ${email}
      `;
      
      if (existing) {
        console.log("Email already registered, updating...");
        await db.exec`
          UPDATE email_registrations
          SET full_name = ${fullName}, clerk_user_id = ${clerkUserId}, updated_at = ${timestamp}
          WHERE email = ${email}
        `;
      } else {
        console.log("New email registration, inserting...");
        await db.exec`
          INSERT INTO email_registrations (email, full_name, clerk_user_id, created_at, updated_at)
          VALUES (${email}, ${fullName}, ${clerkUserId}, ${timestamp}, ${timestamp})
        `;
      }
      
      console.log("Email registration saved to database");
      console.log("=== REGISTER EMAIL SUCCESS ===");

      return {
        success: true,
        message: "Registrasi email berhasil disimpan",
      };
    } catch (err: any) {
      console.error("=== REGISTER EMAIL ERROR ===");
      console.error("Error:", err);
      
      if (err instanceof APIError) {
        throw err;
      }
      
      throw APIError.internal(err.message || "Gagal menyimpan registrasi email");
    }
  }
);
