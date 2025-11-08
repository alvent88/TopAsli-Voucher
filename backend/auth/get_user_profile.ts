import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import db from "../db";

export interface UserProfile {
  clerkUserId: string;
  email: string | null;
  fullName: string | null;
  phoneNumber: string | null;
  birthDate: string | null;
}

export const getUserProfile = api<void, UserProfile>(
  { expose: true, method: "GET", path: "/auth/user-profile", auth: true },
  async () => {
    const auth = getAuthData();
    
    if (!auth || !auth.userID) {
      throw APIError.unauthenticated("User not authenticated");
    }

    try {
      const userId = auth.userID;
      const email = auth.email;
      
      const user = await db.queryRow<{ 
        clerk_user_id: string;
        email: string;
        full_name: string;
        phone_number: string;
        birth_date: Date;
      }>`
        SELECT clerk_user_id, email, full_name, phone_number, birth_date
        FROM users 
        WHERE clerk_user_id = ${userId}
      `;

      if (!user) {
        // User doesn't exist yet, create with minimal data
        await db.exec`
          INSERT INTO users (clerk_user_id, email, full_name, phone_number, birth_date, created_at, updated_at)
          VALUES (${userId}, ${email}, '', '', '2000-01-01', NOW(), NOW())
        `;
        
        return {
          clerkUserId: userId,
          email: email,
          fullName: null,
          phoneNumber: null,
          birthDate: null,
        };
      }

      // Return data from database, with proper null handling
      const birthDateStr = user.birth_date ? user.birth_date.toISOString().split('T')[0] : null;
      
      return {
        clerkUserId: user.clerk_user_id,
        email: user.email || null,
        fullName: user.full_name && user.full_name.trim() !== '' ? user.full_name : null,
        phoneNumber: user.phone_number && user.phone_number.trim() !== '' ? user.phone_number : null,
        birthDate: birthDateStr === '2000-01-01' ? null : birthDateStr,
      };
    } catch (err: any) {
      console.error("Get user profile error:", err);
      throw APIError.internal(err.message || "Gagal mengambil profil");
    }
  }
);
