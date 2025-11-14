import { api, APIError } from "encore.dev/api";
import db from "../db";

export interface Transaction {
  id: string;
  productId: number;
  productName: string;
  packageId: number;
  packageName: string;
  paymentMethodId: number;
  paymentMethodName: string;
  userId: string;
  gameId: string;
  amount: number;
  price: number;
  fee: number;
  total: number;
  status: string;
  createdAt: Date;
  userPhone?: string | null;
  username?: string | null;
}

interface GetTransactionParams {
  id: string;
}

// Retrieves transaction details by ID.
export const get = api<GetTransactionParams, Transaction>(
  { expose: true, method: "GET", path: "/transactions/:id" },
  async ({ id }) => {
    const row = await db.queryRow<any>`
      SELECT 
        t.id, t.product_id, t.package_id, t.payment_method_id, t.user_id, t.game_id,
        t.amount, t.price, t.fee, t.total, t.status, t.created_at, t.username,
        p.name as product_name,
        pkg.name as package_name,
        pm.name as payment_method_name
      FROM transactions t
      JOIN products p ON t.product_id = p.id
      JOIN packages pkg ON t.package_id = pkg.id
      JOIN payment_methods pm ON t.payment_method_id = pm.id
      WHERE t.id = ${id}
    `;

    if (!row) {
      throw APIError.notFound("transaction not found");
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
      total: row.total,
      status: row.status,
      createdAt: row.created_at,
      username: row.username,
    };
  }
);
