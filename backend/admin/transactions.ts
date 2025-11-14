import { api } from "encore.dev/api";
import { Query } from "encore.dev/api";
import db from "../db";
import type { Transaction } from "../transaction/get";
import { createClerkClient } from "@clerk/backend";
import { secret } from "encore.dev/config";

const clerkSecretKey = secret("ClerkSecretKey");
const clerkClient = createClerkClient({ secretKey: clerkSecretKey() });

interface ListTransactionsParams {
  status?: Query<string>;
  limit?: Query<number>;
  email?: Query<string>;
}

interface ListTransactionsResponse {
  transactions: Transaction[];
}

export const listTransactions = api<ListTransactionsParams, ListTransactionsResponse>(
  { expose: true, method: "GET", path: "/admin/transactions", auth: true },
  async ({ status, limit, email }) => {
    let query = `
      SELECT 
        t.id, t.product_id, t.package_id, t.payment_method_id, t.user_id, t.game_id,
        t.amount, t.price, t.fee, t.total, t.status, t.created_at, t.clerk_user_id,
        p.name as product_name,
        pkg.name as package_name,
        pm.name as payment_method_name
      FROM transactions t
      JOIN products p ON t.product_id = p.id
      JOIN packages pkg ON t.package_id = pkg.id
      JOIN payment_methods pm ON t.payment_method_id = pm.id
    `;

    const params: any[] = [];
    const whereConditions: string[] = [];

    if (status) {
      whereConditions.push(`t.status = $${params.length + 1}`);
      params.push(status);
    }

    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    query += ` ORDER BY t.created_at DESC`;

    if (limit) {
      query += ` LIMIT $${params.length + 1}`;
      params.push(limit);
    } else {
      query += ` LIMIT 100`;
    }

    const rows = await db.rawQueryAll<any>(query, ...params);

    let transactions = await Promise.all(rows.map(async (row) => {
      let userPhone = null;
      if (row.clerk_user_id) {
        try {
          const user = await db.queryRow<{ phone_number: string }>`
            SELECT phone_number FROM users WHERE clerk_user_id = ${row.clerk_user_id}
          `;
          userPhone = user?.phone_number || null;
        } catch (err) {
          console.error(`Failed to get phone for user ${row.clerk_user_id}:`, err);
        }
      }

      return {
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
        userPhone,
      };
    }));

    if (email) {
      const phoneLower = email.toLowerCase();
      transactions = transactions.filter(t => 
        t.userPhone && t.userPhone.toLowerCase().includes(phoneLower)
      );
    }

    return { transactions };
  }
);
