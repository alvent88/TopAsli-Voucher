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
    
    if (!auth || !auth.userID || !auth.email) {
      throw APIError.unauthenticated("User not authenticated");
    }

    const email = auth.email;
    
    const user = await db.queryRow<{ 
      full_name: string;
      phone_number: string;
      birth_date: Date;
    }>`
      SELECT full_name, phone_number, birth_date
      FROM users 
      WHERE email = ${email}
    `;

    if (!user) {
      throw APIError.notFound("User tidak ditemukan di database");
    }

    const birthDateStr = user.birth_date ? user.birth_date.toISOString().split('T')[0] : null;
    
    return {
      clerkUserId: auth.userID,
      email: email,
      fullName: user.full_name,
      phoneNumber: user.phone_number,
      birthDate: birthDateStr,
    };
  }
);
