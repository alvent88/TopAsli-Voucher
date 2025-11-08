import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import { createClerkClient } from "@clerk/backend";
import { secret } from "encore.dev/config";
import db from "../db";

const clerkSecretKey = secret("ClerkSecretKey");
const clerkClient = createClerkClient({ secretKey: clerkSecretKey() });

interface ListUsersResponse {
  users: {
    id: string;
    email: string | null;
    phoneNumber: string | null;
    firstName: string | null;
    lastName: string | null;
    fullName: string | null;
    birthDate: string | null;
    createdAt: string;
    lastSignInAt: string | null;
    isAdmin: boolean;
    isSuperAdmin: boolean;
    balance: number;
    isBanned: boolean;
    bannedAt: string | null;
    bannedReason: string | null;
  }[];
}

export const listUsers = api<void, ListUsersResponse>(
  { expose: true, method: "GET", path: "/admin/users", auth: true },
  async () => {
    const auth = getAuthData()!;
    
    if (!auth.isSuperAdmin) {
      throw APIError.permissionDenied("Only superadmin can access user list");
    }

    try {
      const clerkUsers = await clerkClient.users.getUserList({
        limit: 500,
        orderBy: "-created_at",
      });

      const users = await Promise.all(clerkUsers.data.map(async (user) => {
        const metadata = user.unsafeMetadata as any;
        const publicMeta = user.publicMetadata as any;
        
        let balance = 0;
        try {
          const balanceRow = await db.queryRow<{ balance: number }>`
            SELECT balance FROM user_balance WHERE user_id = ${user.id}
          `;
          balance = balanceRow?.balance || 0;
        } catch (err) {
          console.error(`Failed to get balance for user ${user.id}:`, err);
        }

        let isBanned = false;
        let bannedAt = null;
        let bannedReason = null;
        let birthDate = null;
        const email = user.emailAddresses[0]?.emailAddress || null;
        
        try {
          const userRow = await db.queryRow<{ birth_date: string | null }>`
            SELECT birth_date::text as birth_date FROM users WHERE clerk_user_id = ${user.id}
          `;
          
          if (userRow && userRow.birth_date) {
            birthDate = userRow.birth_date.split('T')[0];
          }
        } catch (err) {
          const firstName = user.firstName || "";
          const lastName = user.lastName || "";
          const fullName = [firstName, lastName].filter(Boolean).join(" ") || null;
          const phoneNumber = user.primaryPhoneNumber?.phoneNumber || user.phoneNumbers[0]?.phoneNumber || null;
          
          try {
            await db.exec`
              INSERT INTO users (clerk_user_id, email, full_name, phone_number, birth_date, created_at, updated_at)
              VALUES (${user.id}, ${email}, ${fullName}, ${phoneNumber}, '2000-01-01', NOW(), NOW())
            `;
            birthDate = '2000-01-01';
          } catch (insertErr) {
            console.error(`Failed to auto-create user ${user.id}:`, insertErr);
          }
        }
        
        if (email) {
          try {
            const registrationRow = await db.queryRow<{ is_banned: boolean; banned_at: Date; banned_reason: string }>`
              SELECT is_banned, banned_at, banned_reason
              FROM email_registrations 
              WHERE email = ${email}
            `;
            if (registrationRow) {
              isBanned = registrationRow.is_banned;
              bannedAt = registrationRow.banned_at ? new Date(registrationRow.banned_at).toISOString() : null;
              bannedReason = registrationRow.banned_reason;
            }
          } catch (err) {
            console.error(`Failed to get registration data for user ${user.id}:`, err);
          }
        }
        
        const firstName = user.firstName || null;
        const lastName = user.lastName || null;
        const fullNameFromClerk = [firstName, lastName].filter(Boolean).join(" ") || null;
        const fullName = metadata?.fullName || fullNameFromClerk || null;
        
        return {
          id: user.id,
          email,
          phoneNumber: user.primaryPhoneNumber?.phoneNumber || user.phoneNumbers[0]?.phoneNumber || publicMeta?.phoneNumber || metadata?.phoneNumber || null,
          firstName,
          lastName,
          fullName,
          birthDate,
          createdAt: new Date(user.createdAt).toISOString(),
          lastSignInAt: user.lastSignInAt ? new Date(user.lastSignInAt).toISOString() : null,
          isAdmin: publicMeta?.isAdmin || false,
          isSuperAdmin: publicMeta?.isSuperAdmin || false,
          balance,
          isBanned,
          bannedAt,
          bannedReason,
        };
      }));

      return { users };
    } catch (err) {
      console.error("Error fetching users:", err);
      throw APIError.internal("Failed to fetch users", err as Error);
    }
  }
);

interface DeleteUserRequest {
  userId: string;
}

interface DeleteUserResponse {
  success: boolean;
}

export const deleteUser = api<DeleteUserRequest, DeleteUserResponse>(
  { expose: true, method: "DELETE", path: "/admin/users/:userId", auth: true },
  async ({ userId }) => {
    const auth = getAuthData()!;
    
    if (!auth.isSuperAdmin) {
      throw APIError.permissionDenied("Only superadmin can delete users");
    }

    if (userId === auth.userID) {
      throw APIError.invalidArgument("Cannot delete your own account");
    }

    try {
      await clerkClient.users.deleteUser(userId);
      return { success: true };
    } catch (err) {
      console.error("Error deleting user:", err);
      throw APIError.internal("Failed to delete user", err as Error);
    }
  }
);

interface BanUserRequest {
  email: string;
  reason: string;
}

interface BanUserResponse {
  success: boolean;
  message: string;
}

export const banUser = api<BanUserRequest, BanUserResponse>(
  { expose: true, method: "POST", path: "/admin/users/ban", auth: true },
  async ({ email, reason }) => {
    const auth = getAuthData()!;
    
    if (!auth.isSuperAdmin) {
      throw APIError.permissionDenied("Only superadmin can ban users");
    }

    if (!email) {
      throw APIError.invalidArgument("Email is required");
    }

    const timestamp = new Date();

    await db.exec`
      UPDATE email_registrations 
      SET is_banned = true, 
          banned_at = ${timestamp}, 
          banned_reason = ${reason},
          banned_by = ${auth.userID}
      WHERE email = ${email}
    `;

    await db.exec`
      UPDATE phone_registrations 
      SET is_banned = true, 
          banned_at = ${timestamp}, 
          banned_reason = ${reason},
          banned_by = ${auth.userID}
      WHERE clerk_user_id IN (
        SELECT clerk_user_id FROM email_registrations WHERE email = ${email}
      )
    `;

    return { 
      success: true, 
      message: `User ${email} berhasil dibanned` 
    };
  }
);

interface UnbanUserRequest {
  email: string;
}

interface UnbanUserResponse {
  success: boolean;
  message: string;
}

export const unbanUser = api<UnbanUserRequest, UnbanUserResponse>(
  { expose: true, method: "POST", path: "/admin/users/unban", auth: true },
  async ({ email }) => {
    const auth = getAuthData()!;
    
    if (!auth.isSuperAdmin) {
      throw APIError.permissionDenied("Only superadmin can unban users");
    }

    if (!email) {
      throw APIError.invalidArgument("Email is required");
    }

    await db.exec`
      UPDATE email_registrations 
      SET is_banned = false, 
          banned_at = NULL, 
          banned_reason = NULL,
          banned_by = NULL
      WHERE email = ${email}
    `;

    await db.exec`
      UPDATE phone_registrations 
      SET is_banned = false, 
          banned_at = NULL, 
          banned_reason = NULL,
          banned_by = NULL
      WHERE clerk_user_id IN (
        SELECT clerk_user_id FROM email_registrations WHERE email = ${email}
      )
    `;

    return { 
      success: true, 
      message: `User ${email} berhasil diunban` 
    };
  }
);
