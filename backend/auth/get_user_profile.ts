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

    console.log("GET PROFILE - clerk_user_id:", auth.userID);
    console.log("GET PROFILE - email:", auth.email);
    
    let user = await db.queryRow<{ 
      email: string;
      full_name: string;
      phone_number: string;
      birth_date: Date;
    }>`
      SELECT email, full_name, phone_number, birth_date
      FROM users 
      WHERE clerk_user_id = ${auth.userID}
    `;

    console.log("Found by clerk_user_id:", user ? "YES" : "NO");

    if (!user && auth.email) {
      console.log("Trying by email:", auth.email);
      user = await db.queryRow<{ 
        email: string;
        full_name: string;
        phone_number: string;
        birth_date: Date;
      }>`
        SELECT email, full_name, phone_number, birth_date
        FROM users 
        WHERE email = ${auth.email}
      `;
      console.log("Found by email:", user ? "YES" : "NO");
      
      if (user) {
        console.log("Updating clerk_user_id to:", auth.userID);
        await db.exec`
          UPDATE users 
          SET clerk_user_id = ${auth.userID}, updated_at = NOW()
          WHERE email = ${auth.email}
        `;
      }
    }

    if (!user) {
      console.error("USER NOT FOUND - clerk_user_id:", auth.userID, "email:", auth.email);
      throw APIError.notFound("User tidak ditemukan di database");
    }

    console.log("Returning user:", user.full_name, user.email, user.phone_number);

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
