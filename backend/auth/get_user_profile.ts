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

    const allUsers = [];
    for await (const row of db.query<{ 
      clerk_user_id: string;
      email: string;
      full_name: string;
      phone_number: string;
      birth_date: Date;
    }>`SELECT clerk_user_id, email, full_name, phone_number, birth_date FROM users`) {
      allUsers.push(row);
    }

    let user = allUsers.find(u => u.clerk_user_id === auth.userID);

    if (!user && auth.email) {
      user = allUsers.find(u => u.email === auth.email);
      
      if (user) {
        await db.exec`
          UPDATE users 
          SET clerk_user_id = ${auth.userID}, updated_at = NOW()
          WHERE email = ${user.email}
        `;
      }
    }

    if (!user) {
      await db.exec`
        INSERT INTO users (clerk_user_id, email, full_name, phone_number, birth_date, created_at, updated_at)
        VALUES (${auth.userID}, ${auth.email || ''}, '', '', '2000-01-01', NOW(), NOW())
      `;
      
      return {
        clerkUserId: auth.userID,
        email: auth.email,
        fullName: null,
        phoneNumber: null,
        birthDate: null,
      };
    }

    const birthDateStr = user.birth_date ? user.birth_date.toISOString().split('T')[0] : null;
    
    return {
      clerkUserId: auth.userID,
      email: user.email,
      fullName: user.full_name,
      phoneNumber: user.phone_number,
      birthDate: birthDateStr,
    };
  }
);
