import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import type { Transaction } from "./get";

interface ListUserTransactionsParams {
  sortBy?: "date" | "amount";
  order?: "asc" | "desc";
  startDate?: string;
  endDate?: string;
  status?: string;
}

interface ListUserTransactionsResponse {
  transactions: Transaction[];
  summary: {
    totalTransactions: number;
    totalAmount: number;
    successCount: number;
    pendingCount: number;
    failedCount: number;
  };
}

export const listUserTransactions = api<
  ListUserTransactionsParams,
  ListUserTransactionsResponse
>(
  { expose: true, method: "GET", path: "/transactions/my", auth: true },
  async ({ sortBy = "date", order = "desc", startDate, endDate, status }) => {
    const auth = getAuthData()!;

    let orderClause = "t.created_at DESC";
    if (sortBy === "date") {
      orderClause = order === "asc" ? "t.created_at ASC" : "t.created_at DESC";
    } else if (sortBy === "amount") {
      orderClause = order === "asc" ? "t.total ASC" : "t.total DESC";
    }

    let whereConditions = ["t.user_id = $1"];
    const params: any[] = [auth.userID];
    let paramIndex = 2;

    if (startDate) {
      whereConditions.push(`t.created_at >= $${paramIndex}`);
      params.push(new Date(startDate));
      paramIndex++;
    }

    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      whereConditions.push(`t.created_at <= $${paramIndex}`);
      params.push(endDateTime);
      paramIndex++;
    }

    if (status && status !== "all") {
      whereConditions.push(`t.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    const whereClause = whereConditions.join(" AND ");

    const query = `
      SELECT 
        t.id, t.product_id, t.package_id, t.payment_method_id, t.user_id, t.game_id,
        t.amount, t.price, t.fee, t.total, t.status, t.created_at,
        p.name as product_name,
        pkg.name as package_name,
        pm.name as payment_method_name
      FROM transactions t
      JOIN products p ON t.product_id = p.id
      JOIN packages pkg ON t.package_id = pkg.id
      JOIN payment_methods pm ON t.payment_method_id = pm.id
      WHERE ${whereClause}
      ORDER BY ${orderClause}
    `;

    const rows = await db.rawQueryAll<any>(query, ...params);

    const transactions = rows.map((row) => ({
      id: row.id,
      productId: row.product_id,
      productName: row.product_name,
      packageId: row.package_id,
      packageName: row.package_name,
      paymentMethodId: row.payment_method_id,
      paymentMethodName: row.payment_method_name,
      userId: row.user_id,
      gameId: row.game_id,
      amount: row.amount,
      price: row.price,
      fee: row.fee,
      total: row.price,
      status: row.status,
      createdAt: row.created_at,
    }));

    const totalAmount = transactions.reduce((sum, t) => sum + t.price, 0);
    const successCount = transactions.filter(t => t.status === "success").length;
    const pendingCount = transactions.filter(t => t.status === "pending").length;
    const failedCount = transactions.filter(t => t.status === "failed").length;

    return {
      transactions,
      summary: {
        totalTransactions: transactions.length,
        totalAmount,
        successCount,
        pendingCount,
        failedCount,
      },
    };
  }
);
