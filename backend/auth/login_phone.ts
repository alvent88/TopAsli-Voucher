import { api } from "encore.dev/api";
import { APIError } from "encore.dev/api";
import { createClerkClient } from "@clerk/backend";
import { secret } from "encore.dev/config";
import db from "../db";

const clerkSecretKey = secret("ClerkSecretKey");
const clerkClient = createClerkClient({ secretKey: clerkSecretKey() });

export interface LoginPhoneRequest {
  phoneNumber: string;
}

export interface LoginPhoneResponse {
  userId: string;
  success: boolean;
  isNewUser: boolean;
}

export const loginPhone = api<LoginPhoneRequest, LoginPhoneResponse>(
  { expose: true, method: "POST", path: "/auth/login-phone" },
  async ({ phoneNumber }) => {
    try {
      console.log("=== LOGIN PHONE START ===");
      console.log("Phone number:", phoneNumber);
      
      let formattedPhone = phoneNumber.replace(/\s/g, "").replace(/-/g, "");
      
      if (formattedPhone.startsWith("0")) {
        formattedPhone = "62" + formattedPhone.substring(1);
      } else if (!formattedPhone.startsWith("62")) {
        formattedPhone = "62" + formattedPhone;
      }

      console.log("Formatted phone:", formattedPhone);

      const registrationRow = await db.queryRow<{
        phone_number: string;
        full_name: string;
        birth_place: string;
        birth_date: string;
        clerk_user_id: string | null;
        is_banned: boolean;
        banned_reason: string | null;
      }>`
        SELECT phone_number, full_name, birth_place, birth_date, clerk_user_id, is_banned, banned_reason
        FROM phone_registrations
        WHERE phone_number = ${formattedPhone}
      `;

      if (!registrationRow) {
        throw APIError.notFound("Nomor HP ini belum terdaftar. Silakan registrasi terlebih dahulu.");
      }

      if (registrationRow.is_banned) {
        throw APIError.permissionDenied(`Akun Anda telah dibanned. Alasan: ${registrationRow.banned_reason || "Tidak ada alasan yang diberikan"}`);
      }

      console.log("Registration found for:", registrationRow.full_name);

      let userId: string;
      const randomEmail = `phone${formattedPhone}@temp.topassli.com`;

      if (registrationRow.clerk_user_id) {
        console.log("Clerk user already exists:", registrationRow.clerk_user_id);
        userId = registrationRow.clerk_user_id;
      } else {
        console.log("Creating Clerk user for phone registration...");
        
        const existingUsers = await clerkClient.users.getUserList({
          emailAddress: [randomEmail],
        });

        if (existingUsers.data.length > 0) {
          console.log("User already exists in Clerk:", existingUsers.data[0].id);
          userId = existingUsers.data[0].id;
          
          await clerkClient.users.updateUser(userId, {
            unsafeMetadata: {
              fullName: registrationRow.full_name,
              profileComplete: true,
            },
          });
          console.log("Updated existing user metadata");
        } else {
          const user = await clerkClient.users.createUser({
            emailAddress: [randomEmail],
            skipPasswordRequirement: true,
            skipPasswordChecks: true,
            unsafeMetadata: {
              fullName: registrationRow.full_name,
              profileComplete: true,
            },
            publicMetadata: {
              registeredVia: "phone",
              phoneNumber: `+${formattedPhone}`,
            },
          });
          userId = user.id;
          console.log("Clerk user created:", userId);
        }

        await db.exec`
          UPDATE phone_registrations
          SET clerk_user_id = ${userId}
          WHERE phone_number = ${formattedPhone}
        `;
      }

      console.log("=== LOGIN PHONE SUCCESS ===");

      return {
        userId,
        success: true,
        isNewUser: !registrationRow.clerk_user_id,
      };
    } catch (err: any) {
      console.error("=== LOGIN PHONE ERROR ===");
      console.error("Error:", err);
      
      if (err instanceof APIError) {
        throw err;
      }
      
      throw APIError.internal(err.message || "Gagal login");
    }
  }
);
