import { api } from "encore.dev/api";
import { APIError } from "encore.dev/api";
import { createClerkClient } from "@clerk/backend";
import { secret } from "encore.dev/config";

const clerkSecretKey = secret("ClerkSecretKey");
const clerkClient = createClerkClient({ secretKey: clerkSecretKey() });

export interface EnsureUserExistsRequest {
  email: string;
}

export interface EnsureUserExistsResponse {
  exists: boolean;
  userId?: string;
  message: string;
}

export const ensureUserExists = api<EnsureUserExistsRequest, EnsureUserExistsResponse>(
  { expose: true, method: "POST", path: "/auth/ensure-user-exists" },
  async ({ email }) => {
    try {
      console.log("=== ENSURE USER EXISTS START ===");
      console.log("Email:", email);
      
      const users = await clerkClient.users.getUserList({
        emailAddress: [email],
      });
      
      if (users.data.length > 0) {
        console.log("User already exists:", users.data[0].id);
        return {
          exists: true,
          userId: users.data[0].id,
          message: "User already exists",
        };
      }
      
      console.log("User not found, creating new user...");
      
      const newUser = await clerkClient.users.createUser({
        emailAddress: [email],
        skipPasswordRequirement: true,
        skipPasswordChecks: true,
      });
      
      console.log("User created:", newUser.id);
      console.log("=== ENSURE USER EXISTS SUCCESS ===");
      
      return {
        exists: true,
        userId: newUser.id,
        message: "User created successfully",
      };
    } catch (err: any) {
      console.error("=== ENSURE USER EXISTS ERROR ===");
      console.error("Error:", err);
      
      if (err instanceof APIError) {
        throw err;
      }
      
      throw APIError.internal(err.message || "Gagal memastikan user exists");
    }
  }
);
