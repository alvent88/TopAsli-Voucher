import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import db from "../db";

export interface UpdateUserProfileRequest {
  fullName?: string;
  phoneNumber?: string;
  birthDate?: string;
}

export interface UpdateUserProfileResponse {
  success: boolean;
  message: string;
}

export const updateUserProfile = api<UpdateUserProfileRequest, UpdateUserProfileResponse>(
  { expose: true, method: "POST", path: "/auth/update-user-profile", auth: true },
  async ({ fullName, phoneNumber, birthDate }) => {
    const auth = getAuthData();
    
    if (!auth || !auth.userID) {
      throw APIError.unauthenticated("User not authenticated");
    }

    try {
      const userId = auth.userID;
      const email = auth.email;
      
      const existingUser = await db.queryRow<{ clerk_user_id: string }>`
        SELECT clerk_user_id FROM users WHERE clerk_user_id = ${userId}
      `;

      if (existingUser) {
        if (fullName !== undefined) {
          await db.exec`
            UPDATE users 
            SET full_name = ${fullName}, updated_at = NOW()
            WHERE clerk_user_id = ${userId}
          `;
        }
        if (phoneNumber !== undefined) {
          await db.exec`
            UPDATE users 
            SET phone_number = ${phoneNumber}, updated_at = NOW()
            WHERE clerk_user_id = ${userId}
          `;
        }
        if (birthDate !== undefined) {
          await db.exec`
            UPDATE users 
            SET birth_date = ${birthDate}, updated_at = NOW()
            WHERE clerk_user_id = ${userId}
          `;
        }
      } else {
        await db.exec`
          INSERT INTO users (clerk_user_id, email, full_name, phone_number, birth_date, created_at, updated_at)
          VALUES (${userId}, ${email}, ${fullName || ''}, ${phoneNumber || ''}, ${birthDate || '2000-01-01'}, NOW(), NOW())
        `;
      }

      return {
        success: true,
        message: "Profil berhasil diperbarui",
      };
    } catch (err: any) {
      console.error("Update user profile error:", err);
      throw APIError.internal(err.message || "Gagal memperbarui profil");
    }
  }
);
