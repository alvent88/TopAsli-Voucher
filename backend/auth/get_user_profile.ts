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
      
      console.log("=== GET USER PROFILE ===");
      console.log("userId:", userId);
      console.log("email:", email);
      
      let user = await db.queryRow<{ 
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

      console.log("User found by clerk_user_id:", user ? "Yes" : "No");

      if (!user && email) {
        console.log("Trying to find by email:", email);
        
        // Try multiple ways to find the user
        const allMatches = [];
        for await (const row of db.query<{ 
          clerk_user_id: string;
          email: string;
          full_name: string;
          phone_number: string;
          birth_date: Date;
        }>`
          SELECT clerk_user_id, email, full_name, phone_number, birth_date
          FROM users 
          WHERE email ILIKE ${email}
        `) {
          allMatches.push(row);
        }

        console.log("Found", allMatches.length, "matches for email");
        
        if (allMatches.length > 0) {
          user = allMatches[0];
          console.log("Updating clerk_user_id from", user.clerk_user_id, "to", userId);
          await db.exec`
            UPDATE users 
            SET clerk_user_id = ${userId}, updated_at = NOW()
            WHERE email ILIKE ${email}
          `;
          user.clerk_user_id = userId;
        }
      }

      if (!user) {
        console.log("User not found in database, creating new entry");
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

      // Return data from database
      const birthDateStr = user.birth_date ? user.birth_date.toISOString().split('T')[0] : null;
      
      return {
        clerkUserId: user.clerk_user_id,
        email: user.email,
        fullName: user.full_name,
        phoneNumber: user.phone_number,
        birthDate: birthDateStr,
      };
    } catch (err: any) {
      console.error("Get user profile error:", err);
      throw APIError.internal(err.message || "Gagal mengambil profil");
    }
  }
);
