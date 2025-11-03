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
      
      const existing = await db.queryRow<{ 
        email: string; 
        last_otp_request_at: number | null;
        otp_request_count: number;
      }>`
        SELECT email, last_otp_request_at, otp_request_count 
        FROM email_registrations 
        WHERE email = ${email}
      `;
      
      if (existing?.last_otp_request_at) {
        const timeSinceLastRequest = timestamp - existing.last_otp_request_at;
        const MIN_REQUEST_INTERVAL = 60;
        
        if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
          const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
          throw APIError.resourceExhausted(
            `Mohon tunggu ${waitTime} detik sebelum meminta OTP lagi.`
          );
        }
      }
      
      if (existing) {
        console.log("Email already registered, updating...");
        const newRequestCount = existing.otp_request_count + 1;
        await db.exec`
          UPDATE email_registrations
          SET full_name = ${fullName}, 
              clerk_user_id = ${clerkUserId}, 
              updated_at = ${timestamp},
              last_otp_request_at = ${timestamp},
              otp_request_count = ${newRequestCount}
          WHERE email = ${email}
        `;
      } else {
        console.log("New email registration, inserting...");
        await db.exec`
          INSERT INTO email_registrations (
            email, full_name, clerk_user_id, created_at, updated_at, 
            last_otp_request_at, otp_request_count
          )
          VALUES (
            ${email}, ${fullName}, ${clerkUserId}, ${timestamp}, ${timestamp},
            ${timestamp}, 1
          )
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
