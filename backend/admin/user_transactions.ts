import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import db from "../db";
import type { Transaction } from "../transaction/get";

interface ListUserTransactionsRequest {
  userId: string;
}

interface ListUserTransactionsResponse {
  transactions: Transaction[];
}

export const getUserTransactions = api<ListUserTransactionsRequest, ListUserTransactionsResponse>(
  { expose: true, method: "GET", path: "/admin/users/:userId/transactions", auth: true },
  async ({ userId }) => {
    const auth = getAuthData()!;
    
    if (!auth.isSuperAdmin) {
      throw APIError.permissionDenied("Only superadmin can view user transactions");
    }

    const transactionRows = await db.rawQueryAll<any>(
      `
      SELECT 
        t.id, t.product_id, t.package_id, t.payment_method_id, t.user_id, t.game_id,
        t.amount, t.price, t.fee, t.total, t.status, t.created_at, t.clerk_user_id,
        p.name as product_name,
        pkg.name as package_name,
        pm.name as payment_method_name,
        'transaction' as type
      FROM transactions t
      JOIN products p ON t.product_id = p.id
      JOIN packages pkg ON t.package_id = pkg.id
      JOIN payment_methods pm ON t.payment_method_id = pm.id
      WHERE t.clerk_user_id = $1
      ORDER BY t.created_at DESC
      `,
      userId
    );

    const voucherRows = await db.rawQueryAll<any>(
      `
      SELECT 
        bh.id::text as id,
        bh.amount,
        bh.voucher_code,
        bh.description,
        bh.created_at,
        'voucher' as type
      FROM balance_history bh
      WHERE bh.user_id = $1 AND bh.type = 'voucher_redeem'
      ORDER BY bh.created_at DESC
      `,
      userId
    );

    const transactions = [
      ...transactionRows.map((row) => ({
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
      })),
      ...voucherRows.map((row) => ({
        id: `VOUCHER-${row.id}`,
        productId: 0,
        productName: "Redeem Voucher",
        packageId: 0,
        packageName: row.voucher_code || "Voucher",
        paymentMethodId: 0,
        paymentMethodName: "Voucher",
        userId: "",
        gameId: "",
        amount: row.amount,
        price: row.amount,
        fee: 0,
        total: row.amount,
        status: "success",
        createdAt: row.created_at,
      }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return { transactions };
  }
);
