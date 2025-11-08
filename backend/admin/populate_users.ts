import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import { createClerkClient } from "@clerk/backend";
import { secret } from "encore.dev/config";
import db from "../db";

const clerkSecretKey = secret("ClerkSecretKey");
const clerkClient = createClerkClient({ secretKey: clerkSecretKey() });

export interface PopulateUsersResponse {
  success: boolean;
  created: number;
  updated: number;
  skipped: number;
}

export const populateUsers = api<void, PopulateUsersResponse>(
  { expose: true, method: "POST", path: "/admin/users/populate", auth: true },
  async () => {
    const auth = getAuthData()!;
    
    if (!auth.isSuperAdmin) {
      throw APIError.permissionDenied("Only superadmin can populate users");
    }

    console.log("Starting user population...");

    try {
      const clerkUsers = await clerkClient.users.getUserList({
        limit: 500,
      });

      let created = 0;
      let updated = 0;
      let skipped = 0;

      for (const user of clerkUsers.data) {
        const userEmail = user.emailAddresses[0]?.emailAddress || null;
        const firstName = user.firstName || "";
        const lastName = user.lastName || "";
        const fullName = [firstName, lastName].filter(Boolean).join(" ") || null;
        const phoneNumber = user.primaryPhoneNumber?.phoneNumber || user.phoneNumbers[0]?.phoneNumber || null;

        try {
          const existingUser = await db.queryRow<{ clerk_user_id: string }>`
            SELECT clerk_user_id FROM users WHERE clerk_user_id = ${user.id}
          `;

          if (existingUser) {
            await db.exec`
              UPDATE users 
              SET email = ${userEmail}, 
                  full_name = ${fullName}, 
                  phone_number = ${phoneNumber}, 
                  updated_at = NOW()
              WHERE clerk_user_id = ${user.id}
            `;
            updated++;
            console.log(`Updated user: ${user.id}`);
          } else {
            skipped++;
            console.log(`User not found, skipped: ${user.id}`);
          }
        } catch (err) {
          console.log(`Creating user: ${user.id}`);
          try {
            await db.exec`
              INSERT INTO users (clerk_user_id, email, full_name, phone_number, birth_date, created_at, updated_at)
              VALUES (${user.id}, ${userEmail}, ${fullName}, ${phoneNumber}, '2000-01-01', NOW(), NOW())
            `;
            created++;
            console.log(`Created user: ${user.id}`);
          } catch (insertErr: any) {
            console.error(`Failed to create user ${user.id}:`, insertErr);
            skipped++;
          }
        }
      }

      console.log(`Population complete: ${created} created, ${updated} updated, ${skipped} skipped`);

      return {
        success: true,
        created,
        updated,
        skipped,
      };
    } catch (err: any) {
      console.error("Error populating users:", err);
      throw APIError.internal(`Failed to populate users: ${err.message}`);
    }
  }
);
