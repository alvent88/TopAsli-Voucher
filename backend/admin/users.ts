import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import db from "../db";

interface ListUsersResponse {
  users: {
    id: string;
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
    const auth = getAuthData();
    
    if (!auth || !auth.isSuperAdmin) {
      throw APIError.permissionDenied("Only superadmin can access user list");
    }

    try {
      const dbUsers = await db.queryAll<any>`
        SELECT clerk_user_id, full_name, phone_number, birth_date, created_at
        FROM users
        ORDER BY created_at DESC
      `;

      const users = dbUsers.map((user: any) => ({
        id: user.clerk_user_id || "",
        phoneNumber: user.phone_number || null,
        firstName: null,
        lastName: null,
        fullName: user.full_name || null,
        birthDate: user.birth_date ? String(user.birth_date).substring(0, 10) : null,
        createdAt: user.created_at ? String(user.created_at) : new Date().toISOString(),
        lastSignInAt: null,
        isAdmin: user.phone_number === "62818848168",
        isSuperAdmin: user.phone_number === "62818848168",
        balance: 0,
        isBanned: false,
        bannedAt: null,
        bannedReason: null,
      }));

      return { users };
    } catch (err: any) {
      console.error("Error fetching users:", err);
      throw APIError.internal("Failed to fetch users: " + err.message);
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
  phoneNumber: string;
  reason: string;
}

interface BanUserResponse {
  success: boolean;
  message: string;
}

export const banUser = api<BanUserRequest, BanUserResponse>(
  { expose: true, method: "POST", path: "/admin/users/ban", auth: true },
  async ({ phoneNumber, reason }) => {
    const auth = getAuthData()!;
    
    if (!auth.isSuperAdmin) {
      throw APIError.permissionDenied("Only superadmin can ban users");
    }

    if (!phoneNumber) {
      throw APIError.invalidArgument("Phone number is required");
    }

    const timestamp = new Date();

    await db.exec`
      UPDATE phone_registrations 
      SET is_banned = true, 
          banned_at = ${timestamp}, 
          banned_reason = ${reason},
          banned_by = ${auth.userID}
      WHERE phone_number = ${phoneNumber}
    `;

    return { 
      success: true, 
      message: `User ${phoneNumber} berhasil dibanned` 
    };
  }
);

interface UnbanUserRequest {
  phoneNumber: string;
}

interface UnbanUserResponse {
  success: boolean;
  message: string;
}

export const unbanUser = api<UnbanUserRequest, UnbanUserResponse>(
  { expose: true, method: "POST", path: "/admin/users/unban", auth: true },
  async ({ phoneNumber }) => {
    const auth = getAuthData()!;
    
    if (!auth.isSuperAdmin) {
      throw APIError.permissionDenied("Only superadmin can unban users");
    }

    if (!phoneNumber) {
      throw APIError.invalidArgument("Phone number is required");
    }

    await db.exec`
      UPDATE phone_registrations 
      SET is_banned = false, 
          banned_at = NULL, 
          banned_reason = NULL,
          banned_by = NULL
      WHERE phone_number = ${phoneNumber}
    `;

    return { 
      success: true, 
      message: `User ${phoneNumber} berhasil diunban` 
    };
  }
);
