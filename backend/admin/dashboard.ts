import { api, APIError } from "encore.dev/api";
import db from "../db";
import { getAuthData } from "~encore/auth";

interface DashboardStats {
  totalTransactions: number;
  totalRevenue: number;
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
        COUNT(*) as total_transactions,
        COALESCE(SUM(price), 0) as total_revenue
      FROM transactions
    `;

    const userCount = await db.queryRow<any>`
      SELECT COUNT(*) as total_users FROM users
    `;

    return {
      totalTransactions: parseInt(stats.total_transactions),
      totalRevenue: parseInt(stats.total_revenue),
      totalUsers: parseInt(userCount.total_users),
    };
  }
);
