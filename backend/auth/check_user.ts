import { api } from "encore.dev/api";
import { APIError } from "encore.dev/api";
import { createClerkClient } from "@clerk/backend";
import { secret } from "encore.dev/config";
import db from "../db";

const clerkSecretKey = secret("ClerkSecretKey");
const clerkClient = createClerkClient({ secretKey: clerkSecretKey() });

export interface CheckUserRequest {
  identifier: string;
}

export interface CheckUserResponse {
  exists: boolean;
  type: "email" | "phone" | null;
  message?: string;
}

const isPhoneNumber = (value: string): boolean => {
  return /^[+]?[0-9]{10,15}$/.test(value.replace(/\s/g, ""));
};

export const checkUser = api<CheckUserRequest, CheckUserResponse>(
  { expose: true, method: "POST", path: "/auth/check-user" },
  async ({ identifier }) => {
    console.log("=== CHECK USER START ===");
    console.log("Identifier:", identifier);

    try {
      const isPhone = isPhoneNumber(identifier);

      if (isPhone) {
        let formattedPhone = identifier.replace(/\s/g, "").replace(/-/g, "");
        
        if (formattedPhone.startsWith("0")) {
          formattedPhone = "62" + formattedPhone.substring(1);
        } else if (!formattedPhone.startsWith("62")) {
          formattedPhone = "62" + formattedPhone;
        }

        console.log("Checking phone:", formattedPhone);

        const registrationRow = await db.queryRow<{ phone_number: string; is_banned: boolean; banned_reason: string }>`
          SELECT phone_number, is_banned, banned_reason FROM phone_registrations WHERE phone_number = ${formattedPhone}
        `;

        if (registrationRow) {
          if (registrationRow.is_banned) {
            throw APIError.permissionDenied(`Akun Anda telah dibanned. Alasan: ${registrationRow.banned_reason || "Tidak ada alasan yang diberikan"}`);
          }
          
          console.log("Phone user found in database");
          return {
            exists: true,
            type: "phone",
            message: "Nomor HP terdaftar",
          };
        } else {
          console.log("Phone user NOT found");
          return {
            exists: false,
            type: null,
            message: "Nomor HP belum terdaftar. Silakan daftar terlebih dahulu.",
          };
        }
      } else {
        console.log("Checking email:", identifier);

        const emailRow = await db.queryRow<{ email: string; is_banned: boolean; banned_reason: string }>`
          SELECT email, is_banned, banned_reason FROM email_registrations WHERE email = ${identifier}
        `;

        if (emailRow) {
          if (emailRow.is_banned) {
            throw APIError.permissionDenied(`Akun Anda telah dibanned. Alasan: ${emailRow.banned_reason || "Tidak ada alasan yang diberikan"}`);
          }
          
          console.log("Email user found in database");
          return {
            exists: true,
            type: "email",
            message: "Email terdaftar",
          };
        } else {
          console.log("Email user NOT found");
          return {
            exists: false,
            type: null,
            message: "Email belum terdaftar. Silakan daftar terlebih dahulu.",
          };
        }
      }
    } catch (err: any) {
      console.error("=== CHECK USER ERROR ===");
      console.error("Error:", err);
      
      if (err instanceof APIError) {
        throw err;
      }
      
      throw APIError.internal(err.message || "Gagal memeriksa user");
    }
  }
);
