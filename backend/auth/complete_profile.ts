import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import { createClerkClient } from "@clerk/backend";
import { secret } from "encore.dev/config";

const clerkSecretKey = secret("ClerkSecretKey");
const clerkClient = createClerkClient({ secretKey: clerkSecretKey() });

export interface CompleteProfileRequest {
  fullName: string;
}

export interface CompleteProfileResponse {
  success: boolean;
  message: string;
}

export const completeProfile = api<CompleteProfileRequest, CompleteProfileResponse>(
  { expose: true, method: "POST", path: "/auth/complete-profile", auth: true },
  async ({ fullName }) => {
    const auth = getAuthData();
    
    if (!auth || !auth.userID) {
      throw APIError.unauthenticated("User not authenticated");
    }

    console.log("=== COMPLETE PROFILE START ===");
    console.log("User ID:", auth.userID);
    console.log("Full name:", fullName);

    try {
      await clerkClient.users.updateUser(auth.userID, {
        unsafeMetadata: {
          fullName,
          profileComplete: true,
        },
      });

      console.log("Profile updated successfully");

      return {
        success: true,
        message: "Profil berhasil dilengkapi",
      };
    } catch (err: any) {
      console.error("=== COMPLETE PROFILE ERROR ===");
      console.error("Error:", err);
      
      throw APIError.internal(err.message || "Gagal melengkapi profil");
    }
  }
);
