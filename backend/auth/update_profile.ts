import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import { createClerkClient } from "@clerk/backend";
import { secret } from "encore.dev/config";

const clerkSecretKey = secret("ClerkSecretKey");
const clerkClient = createClerkClient({ secretKey: clerkSecretKey() });

export interface UpdateProfileRequest {
  fullName: string;
}

export interface UpdateProfileResponse {
  success: boolean;
  message: string;
}

export const updateProfile = api<UpdateProfileRequest, UpdateProfileResponse>(
  { expose: true, method: "POST", path: "/auth/update-profile", auth: true },
  async ({ fullName }) => {
    const auth = getAuthData();
    
    if (!auth || !auth.userID) {
      throw APIError.unauthenticated("User not authenticated");
    }

    console.log("=== UPDATE PROFILE START ===");
    console.log("User ID:", auth.userID);
    console.log("Full name:", fullName);

    try {
      await clerkClient.users.updateUser(auth.userID, {
        unsafeMetadata: {
          fullName,
          profileComplete: true,
        },
      });

      console.log("Profile updated successfully in Clerk");

      return {
        success: true,
        message: "Profil berhasil diperbarui",
      };
    } catch (err: any) {
      console.error("=== UPDATE PROFILE ERROR ===");
      console.error("Error:", err);
      
      throw APIError.internal(err.message || "Gagal memperbarui profil");
    }
  }
);
