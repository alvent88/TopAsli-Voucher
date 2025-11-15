import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import db from "../db";

export interface UserProfile {
  clerkUserId: string;
  phoneNumber: string | null;
  fullName: string | null;
  birthDate: string | null;
}

export const getUserProfile = api<void, UserProfile>(
  { expose: true, method: "GET", path: "/auth/user-profile", auth: true },
  async () => {
    const auth = getAuthData();
    
    if (!auth || !auth.userID) {
      throw APIError.unauthenticated("User not authenticated");
    }

    const user = await db.queryRow<{ 
      clerk_user_id: string;
      full_name: string;
      phone_number: string;
      birth_date: string;
    }>`
      SELECT clerk_user_id, full_name, phone_number, TO_CHAR(date_of_birth, 'YYYY-MM-DD') as birth_date 
      FROM users 
      WHERE clerk_user_id = ${auth.userID}
    `;

    if (!user) {
      throw APIError.notFound("User not found");
    }

    const birthDateStr = user.birth_date || null;
    
    return {
      clerkUserId: auth.userID,
      phoneNumber: user.phone_number,
      fullName: user.full_name,
      birthDate: birthDateStr,
    };
  }
);
