import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import db from "../db";
import { createClerkClient } from "@clerk/backend";
import { secret } from "encore.dev/config";

const clerkSecretKey = secret("ClerkSecretKey");
const clerkClient = createClerkClient({ secretKey: clerkSecretKey() });

export interface AutoRegisterResponse {
  success: boolean;
  message: string;
  isNewUser: boolean;
}

export const autoRegister = api<void, AutoRegisterResponse>(
  { expose: true, method: "POST", path: "/auth/auto-register", auth: true },
  async () => {
    const auth = getAuthData()!;
    const userId = auth.userID;
    const email = auth.email;

    if (!email) {
      throw APIError.invalidArgument("Email not found in auth data");
    }

    console.log("=== AUTO-REGISTER START ===");
    console.log("User ID:", userId);
    console.log("Email:", email);

    const existingUser = await db.queryRow<{ email: string }>`
      SELECT email FROM email_registrations WHERE email = ${email}
    `;

    if (existingUser) {
      console.log("User already exists in database");
      return {
        success: true,
        message: "User already registered",
        isNewUser: false,
      };
    }

    try {
      const user = await clerkClient.users.getUser(userId);
      const firstName = user.firstName || "";
      const lastName = user.lastName || "";
      const fullName = `${firstName} ${lastName}`.trim() || email.split("@")[0];

      console.log("Creating new user in database...");
      console.log("Full name:", fullName);

      await db.exec`
        INSERT INTO email_registrations (email, full_name, clerk_user_id, is_verified)
        VALUES (${email}, ${fullName}, ${userId}, true)
      `;

      console.log("User registered successfully!");
      console.log("=== AUTO-REGISTER SUCCESS ===");

      return {
        success: true,
        message: "User registered successfully",
        isNewUser: true,
      };
    } catch (err: any) {
      console.error("=== AUTO-REGISTER ERROR ===");
      console.error("Error:", err);
      
      if (err instanceof APIError) {
        throw err;
      }
      
      throw APIError.internal(err.message || "Failed to auto-register user");
    }
  }
);
