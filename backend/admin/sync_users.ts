import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import { createClerkClient } from "@clerk/backend";
import { secret } from "encore.dev/config";
import db from "../db";

const clerkSecretKey = secret("ClerkSecretKey");
const clerkClient = createClerkClient({ secretKey: clerkSecretKey() });

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
      const clerkUsers = await clerkClient.users.getUserList({
        limit: 500,
      });

      let synced = 0;
      let skipped = 0;

      for (const user of clerkUsers.data) {
        const userId = user.id;
        const email = user.emailAddresses[0]?.emailAddress || null;
        const firstName = user.firstName || "";
        const lastName = user.lastName || "";
        const fullName = [firstName, lastName].filter(Boolean).join(" ");
        const phoneNumber = user.primaryPhoneNumber?.phoneNumber || user.phoneNumbers[0]?.phoneNumber || "";

        const existing = await db.queryRow<{ clerk_user_id: string }>`
          SELECT clerk_user_id FROM users WHERE clerk_user_id = ${userId}
        `;

        if (!existing) {
          await db.exec`
            INSERT INTO users (clerk_user_id, email, full_name, phone_number, birth_date, created_at, updated_at)
            VALUES (${userId}, ${email}, ${fullName}, ${phoneNumber}, '2000-01-01', NOW(), NOW())
          `;
          synced++;
        } else {
          skipped++;
        }
      }

      return {
        success: true,
        message: `Sync completed: ${synced} users added, ${skipped} users skipped`,
        synced,
        skipped,
      };
    } catch (err: any) {
      console.error("Sync users error:", err);
      throw APIError.internal(err.message || "Failed to sync users");
    }
  }
);
