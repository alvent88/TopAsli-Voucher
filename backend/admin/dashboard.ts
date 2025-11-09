import { api } from "encore.dev/api";
import db from "../db";

interface DashboardStats {
  totalTransactions: number;
  totalRevenue: number;
  pendingTransactions: number;
  successTransactions: number;
  totalUsers: number;
}

export const dashboard = api<void, DashboardStats>(
  { expose: true, method: "GET", path: "/admin/dashboard", auth: true },
  async () => {
    const stats = await db.queryRow<any>`
      SELECT 
        COUNT(*) as total_transactions,
        COALESCE(SUM(price), 0) as total_revenue,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_transactions,
        COUNT(*) FILTER (WHERE status = 'success') as success_transactions
      FROM transactions
    `;

    const userCount = await db.queryRow<any>`
      SELECT COUNT(*) as total_users FROM users
    `;

    return {
      totalTransactions: parseInt(stats.total_transactions),
      totalRevenue: parseInt(stats.total_revenue),
      pendingTransactions: parseInt(stats.pending_transactions),
      successTransactions: parseInt(stats.success_transactions),
      totalUsers: parseInt(userCount.total_users),
    };
  }
);
