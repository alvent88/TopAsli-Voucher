import { api } from "encore.dev/api";
import { APIError } from "encore.dev/api";
import { createClerkClient } from "@clerk/backend";
import { secret } from "encore.dev/config";
import db from "../db";

const clerkSecretKey = secret("ClerkSecretKey");
const clerkClient = createClerkClient({ secretKey: clerkSecretKey() });

export interface SaveUserProfileRequest {
  email: string;
  fullName: string;
  phoneNumber: string;
  clerkUserId?: string;
}

export interface SaveUserProfileResponse {
  success: boolean;
  message: string;
  userId?: string;
}

export const saveUserProfile = api<SaveUserProfileRequest, SaveUserProfileResponse>(
  { expose: true, method: "POST", path: "/auth/save-user-profile" },
  async ({ email, fullName, phoneNumber, clerkUserId }) => {
    try {
      console.log("=== SAVE USER PROFILE START ===");
      console.log("Email:", email);
      console.log("Full name:", fullName);
      console.log("Phone number:", phoneNumber);
      console.log("Clerk User ID (optional):", clerkUserId);
      
      let formattedPhone = phoneNumber.replace(/\s/g, "").replace(/-/g, "");
      if (formattedPhone.startsWith("0")) {
        formattedPhone = "62" + formattedPhone.substring(1);
      } else if (!formattedPhone.startsWith("62")) {
        formattedPhone = "62" + formattedPhone;
      }
      
      console.log("Formatted phone:", formattedPhone);
      
      let userId = clerkUserId;
      
      // If no userId provided, find user by email
      if (!userId) {
        console.log("No user ID provided, finding user by email...");
        const users = await clerkClient.users.getUserList({
          emailAddress: [email],
        });
        
        if (users.data.length === 0) {
          throw APIError.notFound(`User dengan email ${email} tidak ditemukan di Clerk`);
        }
        
        userId = users.data[0].id;
        console.log("Found user ID:", userId);
      }
      
      const timestamp = Math.floor(Date.now() / 1000);
      
      const existing = await db.queryRow<{ email: string }>`
        SELECT email FROM email_registrations WHERE email = ${email}
      `;
      
      if (existing) {
        console.log("Updating existing email registration...");
        await db.exec`
          UPDATE email_registrations
          SET full_name = ${fullName}, clerk_user_id = ${userId}, updated_at = ${timestamp}
          WHERE email = ${email}
        `;
      } else {
        console.log("Creating new email registration...");
        await db.exec`
          INSERT INTO email_registrations (email, full_name, clerk_user_id, created_at, updated_at)
          VALUES (${email}, ${fullName}, ${userId}, ${timestamp}, ${timestamp})
        `;
      }
      
      console.log("Updating Clerk user metadata...");
      await clerkClient.users.updateUser(userId, {
        unsafeMetadata: {
          fullName,
          phoneNumber: formattedPhone,
          profileComplete: true,
        },
      });
      
      console.log("User profile saved successfully");
      console.log("=== SAVE USER PROFILE SUCCESS ===");

      return {
        success: true,
        message: "Profil berhasil disimpan",
        userId,
      };
    } catch (err: any) {
      console.error("=== SAVE USER PROFILE ERROR ===");
      console.error("Error:", err);
      
      if (err instanceof APIError) {
        throw err;
      }
      
      throw APIError.internal(err.message || "Gagal menyimpan profil");
    }
  }
);
