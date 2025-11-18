import { api } from "encore.dev/api";
import { APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

export interface User {
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
}

export interface ListUsersResponse {
  users: User[];
}

export const listUsers = api<void, ListUsersResponse>(
  { expose: true, method: "GET", path: "/admin/users", auth: true },
  async () => {
    const auth = getAuthData();
    if (!auth || !auth.isAdmin) {
      throw APIError.permissionDenied("Admin access required");
    }

    try {
      const rows = await db.rawQueryAll<any>(
        `SELECT 
          u.clerk_user_id as id,
          u.phone_number,
          u.full_name,
          u.date_of_birth as birth_date,
          u.created_at,
          u.is_banned,
          u.banned_at,
          u.ban_reason,
          u.is_admin,
          u.is_superadmin,
          COALESCE(ub.balance, 0) as balance,
          lh.last_login
         FROM users u
         LEFT JOIN user_balance ub ON ub.user_id = u.clerk_user_id
         LEFT JOIN (
           SELECT user_id, MAX(created_at) as last_login
           FROM login_history
           WHERE login_status = 'success'
           GROUP BY user_id
         ) lh ON lh.user_id = u.clerk_user_id
         ORDER BY u.created_at DESC`
      );

      const users: User[] = rows.map((row: any) => ({
        id: row.id,
        phoneNumber: row.phone_number,
        firstName: null,
        lastName: null,
        fullName: row.full_name,
        birthDate: row.birth_date ? new Date(row.birth_date).toISOString() : null,
        createdAt: new Date(row.created_at).toISOString(),
        lastSignInAt: row.last_login ? new Date(row.last_login).toISOString() : null,
        isAdmin: row.is_admin || false,
        isSuperAdmin: row.is_superadmin || false,
        balance: parseFloat(row.balance) || 0,
        isBanned: row.is_banned || false,
        bannedAt: row.banned_at ? new Date(row.banned_at).toISOString() : null,
        bannedReason: row.ban_reason,
      }));

      return { users };
    } catch (err) {
      console.error("List users error:", err);
      throw APIError.internal("Failed to list users", err as Error);
    }
  }
);
