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
  debug?: {
    userId?: string;
    email?: string;
    existingUser?: boolean;
    error?: string;
  };
}

export const autoRegister = api<void, AutoRegisterResponse>(
  { expose: true, method: "POST", path: "/auth/auto-register", auth: true },
  async () => {
    const auth = getAuthData()!;
    const userId = auth.userID;
    let email = auth.email;

    console.log("=== AUTO-REGISTER START ===");
    console.log("User ID:", userId);
    console.log("Email from auth:", email);

    if (!email) {
      console.log("Email not in auth data, fetching from Clerk user...");
      const user = await clerkClient.users.getUser(userId);
      email = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress ?? null;
      console.log("Email from Clerk:", email);
      
      if (!email) {
        throw APIError.invalidArgument("Email not found");
      }
    }

    console.log("Final email:", email);

    const existingUser = await db.queryRow<{ email: string }>`
      SELECT email FROM email_registrations WHERE email = ${email}
    `;

    if (existingUser) {
      console.log("User already exists in database");
      return {
        success: true,
        message: "User already registered",
        isNewUser: false,
        debug: {
          userId,
          email,
          existingUser: true,
        },
      };
    }

    try {
      console.log("Fetching user from Clerk...");
      const user = await clerkClient.users.getUser(userId);
      const firstName = user.firstName || "";
      const lastName = user.lastName || "";
      const fullName = `${firstName} ${lastName}`.trim() || email.split("@")[0];

      console.log("Creating new user in database...");
      console.log("Full name:", fullName);
      console.log("User ID:", userId);
      console.log("Email:", email);

      const now = Date.now();
      
      console.log("Executing INSERT query...");
      const result = await db.exec`
        INSERT INTO email_registrations (email, full_name, clerk_user_id, created_at, updated_at, is_banned, otp_request_count)
        VALUES (${email}, ${fullName}, ${userId}, ${now}, ${now}, false, 0)
      `;
      console.log("INSERT result:", result);

      console.log("User registered successfully!");
      console.log("=== AUTO-REGISTER SUCCESS ===");

      return {
        success: true,
        message: "User registered successfully",
        isNewUser: true,
        debug: {
          userId,
          email,
          existingUser: false,
        },
      };
    } catch (err: any) {
      console.error("=== AUTO-REGISTER ERROR ===");
      console.error("Error message:", err.message);
      console.error("Error stack:", err.stack);
      console.error("Full error:", err);
      
      return {
        success: false,
        message: err.message || "Failed to auto-register user",
        isNewUser: false,
        debug: {
          userId,
          email: email || "unknown",
          error: err.message,
        },
      };
    }
  }
);
