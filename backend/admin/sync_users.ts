import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import db from "../db";

interface SyncUsersResponse {
  success: boolean;
  message: string;
  synced: number;
  skipped: number;
}

export const syncAllUsers = api<void, SyncUsersResponse>(
  { expose: true, method: "POST", path: "/admin/sync-all-users", auth: true },
  async () => {
    const auth = getAuthData()!;
    
    if (!auth.isSuperAdmin) {
      throw APIError.permissionDenied("Only superadmin can sync users");
    }

    try {
      return {
        success: true,
        message: "Sync users is no longer needed - system uses phone-only authentication",
        synced: 0,
        skipped: 0,
      };
    } catch (err: any) {
      console.error("Sync users error:", err);
      throw APIError.internal(err.message || "Failed to sync users");
    }
  }
);
