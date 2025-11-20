import { api, APIError } from "encore.dev/api";
import db from "../db";
import { getAuthData } from "~encore/auth";

interface DashboardStats {
  totalTransactions: number;
  totalUsers: number;
}

export const dashboard = api<void, DashboardStats>(
  { expose: true, method: "GET", path: "/admin/dashboard", auth: true },
  async () => {
    const auth = getAuthData();
    if (!auth || !auth.isAdmin) {
      throw APIError.permissionDenied("admin access required");
    }

    const stats = await db.queryRow<any>`
      SELECT 
        COUNT(*) as total_transactions
      FROM transactions
      WHERE DATE(created_at) = CURRENT_DATE
    `;

    const userCount = await db.queryRow<any>`
      SELECT COUNT(*) as total_users FROM users
    `;

    return {
      totalTransactions: parseInt(stats.total_transactions),
      totalUsers: parseInt(userCount.total_users),
    };
  }
);
