import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import db from "../db";
import { createClerkClient } from "@clerk/backend";
import { secret } from "encore.dev/config";

const clerkSecretKey = secret("ClerkSecretKey");
const clerkClient = createClerkClient({ secretKey: clerkSecretKey() });

export interface SyncPhoneMetadataResponse {
  success: boolean;
  message: string;
  synced: number;
  errors: Array<{ email: string; error: string }>;
}

export const syncPhoneMetadata = api<void, SyncPhoneMetadataResponse>(
  { expose: true, method: "POST", path: "/admin/sync-phone-metadata", auth: true },
  async () => {
    const auth = getAuthData()!;
    
    if (!auth.isSuperAdmin) {
      throw APIError.permissionDenied("Only super admin can sync phone metadata");
    }

    console.log("=== SYNC PHONE METADATA START ===");

    const users = await db.rawQueryAll<{
      email: string;
      clerk_user_id: string | null;
    }>`
      SELECT email, clerk_user_id
      FROM email_registrations
      WHERE clerk_user_id IS NOT NULL
    `;

    console.log(`Found ${users.length} users with Clerk IDs`);

    let synced = 0;
    const errors: Array<{ email: string; error: string }> = [];

    for (const user of users) {
      try {
        console.log(`Processing user: ${user.email}`);
        
        const clerkUser = await clerkClient.users.getUser(user.clerk_user_id!);
        
        const phoneNumber = clerkUser.unsafeMetadata?.phoneNumber as string | undefined;
        
        if (phoneNumber) {
          console.log(`Syncing phone ${phoneNumber} to publicMetadata for ${user.email}`);
          
          await clerkClient.users.updateUser(user.clerk_user_id!, {
            publicMetadata: {
              ...clerkUser.publicMetadata,
              phoneNumber: phoneNumber,
            },
          });
          
          synced++;
          console.log(`✅ Synced ${user.email}`);
        } else {
          console.log(`⚠️ No phone number found in unsafeMetadata for ${user.email}`);
          errors.push({
            email: user.email,
            error: "No phone number in unsafeMetadata",
          });
        }
      } catch (err: any) {
        console.error(`❌ Failed to sync ${user.email}:`, err.message);
        errors.push({
          email: user.email,
          error: err.message,
        });
      }
    }

    console.log(`=== SYNC COMPLETE: ${synced} synced, ${errors.length} errors ===`);

    return {
      success: true,
      message: `Synced ${synced} users, ${errors.length} errors`,
      synced,
      errors,
    };
  }
);
