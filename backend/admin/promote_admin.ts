import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import { createClerkClient } from "@clerk/backend";
import { secret } from "encore.dev/config";

const clerkSecretKey = secret("ClerkSecretKey");
const clerkClient = createClerkClient({ secretKey: clerkSecretKey() });

export interface PromoteToAdminRequest {
  userId: string;
  role: "admin" | "superadmin";
}

export interface PromoteToAdminResponse {
  success: boolean;
  message: string;
}

export const promoteToAdmin = api<PromoteToAdminRequest, PromoteToAdminResponse>(
  { expose: true, method: "POST", path: "/admin/users/:userId/promote", auth: true },
  async ({ userId, role }) => {
    const auth = getAuthData()!;
    
    if (!auth.isSuperAdmin) {
      throw APIError.permissionDenied("Only superadmin can promote users to admin");
    }

    if (userId === auth.userID) {
      throw APIError.invalidArgument("Cannot modify your own admin status");
    }

    console.log("=== PROMOTE TO ADMIN START ===");
    console.log("Target user ID:", userId);
    console.log("Role:", role);
    console.log("Promoted by:", auth.userID);

    try {
      const user = await clerkClient.users.getUser(userId);
      
      const currentIsAdmin = (user.publicMetadata?.isAdmin as boolean) || false;
      const currentIsSuperAdmin = (user.publicMetadata?.isSuperAdmin as boolean) || false;

      await clerkClient.users.updateUser(userId, {
        publicMetadata: {
          ...user.publicMetadata,
          isAdmin: role === "admin" || role === "superadmin",
          isSuperAdmin: role === "superadmin",
        },
      });

      console.log(`User promoted to ${role} successfully`);

      return {
        success: true,
        message: `User berhasil diangkat menjadi ${role === "superadmin" ? "superadmin" : "admin"}`,
      };
    } catch (err: any) {
      console.error("=== PROMOTE TO ADMIN ERROR ===");
      console.error("Error:", err);
      
      if (err instanceof APIError) {
        throw err;
      }
      
      throw APIError.internal(err.message || "Gagal mengangkat user menjadi admin");
    }
  }
);

export interface DemoteFromAdminRequest {
  userId: string;
}

export interface DemoteFromAdminResponse {
  success: boolean;
  message: string;
}

export const demoteFromAdmin = api<DemoteFromAdminRequest, DemoteFromAdminResponse>(
  { expose: true, method: "POST", path: "/admin/users/:userId/demote", auth: true },
  async ({ userId }) => {
    const auth = getAuthData()!;
    
    if (!auth.isSuperAdmin) {
      throw APIError.permissionDenied("Only superadmin can demote admins");
    }

    if (userId === auth.userID) {
      throw APIError.invalidArgument("Cannot modify your own admin status");
    }

    console.log("=== DEMOTE FROM ADMIN START ===");
    console.log("Target user ID:", userId);
    console.log("Demoted by:", auth.userID);

    try {
      const user = await clerkClient.users.getUser(userId);
      
      const currentIsAdmin = (user.publicMetadata?.isAdmin as boolean) || false;
      const currentIsSuperAdmin = (user.publicMetadata?.isSuperAdmin as boolean) || false;
      
      if (!currentIsAdmin && !currentIsSuperAdmin) {
        throw APIError.invalidArgument("User is not an admin or superadmin");
      }

      await clerkClient.users.updateUser(userId, {
        publicMetadata: {
          ...user.publicMetadata,
          isAdmin: false,
          isSuperAdmin: false,
        },
      });

      console.log("User demoted from admin successfully");

      return {
        success: true,
        message: "User berhasil diturunkan dari admin",
      };
    } catch (err: any) {
      console.error("=== DEMOTE FROM ADMIN ERROR ===");
      console.error("Error:", err);
      
      if (err instanceof APIError) {
        throw err;
      }
      
      throw APIError.internal(err.message || "Gagal menurunkan admin");
    }
  }
);
