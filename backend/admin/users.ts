import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import db from "../db";

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
      const dbUsers = await db.query<{
        clerk_user_id: string;
        email: string | null;
        full_name: string | null;
        phone_number: string | null;
        birth_date: string | null;
        created_at: Date;
      }>`
        SELECT clerk_user_id, email, full_name, phone_number, birth_date::text as birth_date, created_at
        FROM users
        ORDER BY created_at DESC
      `;

      const users = await Promise.all(dbUsers.map(async (user) => {
        let balance = 0;
        try {
          const balanceRow = await db.queryRow<{ balance: number }>`
            SELECT balance FROM user_balance WHERE user_id = ${user.clerk_user_id}
          `;
          balance = balanceRow?.balance || 0;
        } catch (err) {
          console.error(`Failed to get balance for user ${user.clerk_user_id}:`, err);
        }

        let isBanned = false;
        let bannedAt = null;
        let bannedReason = null;
        
        if (user.email) {
          try {
            const registrationRow = await db.queryRow<{ is_banned: boolean; banned_at: Date; banned_reason: string }>`
              SELECT is_banned, banned_at, banned_reason
              FROM email_registrations 
              WHERE email = ${user.email}
            `;
            if (registrationRow) {
              isBanned = registrationRow.is_banned;
              bannedAt = registrationRow.banned_at ? new Date(registrationRow.banned_at).toISOString() : null;
              bannedReason = registrationRow.banned_reason;
            }
          } catch (err) {
            console.error(`Failed to get registration data for user ${user.clerk_user_id}:`, err);
          }
        }
        
        const isSuperAdmin = user.email === "alvent88@gmail.com";
        const isAdmin = isSuperAdmin;
        
        return {
          id: user.clerk_user_id,
          email: user.email,
          phoneNumber: user.phone_number,
          firstName: null,
          lastName: null,
          fullName: user.full_name,
          birthDate: user.birth_date ? user.birth_date.split('T')[0] : null,
          createdAt: new Date(user.created_at).toISOString(),
          lastSignInAt: null,
          isAdmin,
          isSuperAdmin,
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
      await db.exec`
        DELETE FROM users WHERE clerk_user_id = ${userId}
      `;
      
      await db.exec`
        DELETE FROM user_balance WHERE user_id = ${userId}
      `;
      
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
