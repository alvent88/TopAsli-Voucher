import { api } from "encore.dev/api";
import { APIError } from "encore.dev/api";
import { createClerkClient } from "@clerk/backend";
import { secret } from "encore.dev/config";

const clerkSecretKey = secret("ClerkSecretKey");
const clerkClient = createClerkClient({ secretKey: clerkSecretKey() });

export interface CompleteEmailRegistrationRequest {
  email: string;
  fullName: string;
}

export interface CompleteEmailRegistrationResponse {
  success: boolean;
  message: string;
  userId?: string;
}

export const completeEmailRegistration = api<CompleteEmailRegistrationRequest, CompleteEmailRegistrationResponse>(
  { expose: true, method: "POST", path: "/auth/complete-email-registration" },
  async ({ email, fullName }) => {
    console.log("=== COMPLETE EMAIL REGISTRATION START ===");
    console.log("Email:", email);
    console.log("Full name:", fullName);

    try {
      const users = await clerkClient.users.getUserList({
        emailAddress: [email],
      });

      if (users.data.length === 0) {
        throw APIError.notFound(`User dengan email ${email} tidak ditemukan. Pastikan sudah verifikasi OTP.`);
      }

      const user = users.data[0];
      
      console.log("Found user:", user.id);

      await clerkClient.users.updateUser(user.id, {
        unsafeMetadata: {
          fullName,
          profileComplete: true,
        },
      });

      console.log("User metadata updated successfully in Clerk");

      return {
        success: true,
        message: "Registrasi berhasil dilengkapi",
        userId: user.id,
      };
    } catch (err: any) {
      console.error("=== COMPLETE EMAIL REGISTRATION ERROR ===");
      console.error("Error:", err);
      
      if (err instanceof APIError) {
        throw err;
      }
      
      throw APIError.internal(err.message || "Gagal melengkapi registrasi email");
    }
  }
);
