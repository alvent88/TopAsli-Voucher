import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

export interface UserTransactionHistoryItem {
  id: string;
  date: string;
  type: "topup" | "voucher" | "purchase";
  description: string;
  debit: number;
  credit: number;
  balance: number;
  relatedData?: {
    productName?: string;
    packageName?: string;
    gameId?: string;
    voucherCode?: string;
  };
}

export interface GetUserTransactionHistoryParams {
  startDate?: string;
  endDate?: string;
}

export interface GetUserTransactionHistoryResponse {
  history: UserTransactionHistoryItem[];
  currentBalance: number;
}

export const getUserTransactionHistory = api<
  GetUserTransactionHistoryParams,
  GetUserTransactionHistoryResponse
>(
  { expose: true, method: "GET", path: "/transaction/history", auth: true },
  async ({ startDate, endDate }) => {
    const auth = getAuthData()!;

    try {
      console.log("=== GET USER TRANSACTION HISTORY ===");
      console.log("User ID:", auth.userID);

      // Get current balance
      let balanceRow = await db.queryRow<{ balance: number }>`
        SELECT balance FROM user_balance WHERE user_id = ${auth.userID}
      `;

      if (!balanceRow) {
        await db.exec`
          INSERT INTO user_balance (user_id, balance) VALUES (${auth.userID}, 0)
        `;
        balanceRow = { balance: 0 };
      }

      const currentBalance = balanceRow.balance;

      // Get balance history (voucher redemptions, topups)
      let balanceHistoryQuery = `
        SELECT 
          id::text,
          created_at,
          amount,
          type,
          description,
          voucher_code
        FROM balance_history
        WHERE user_id = $1
      `;
      const balanceParams: any[] = [auth.userID];
      let paramIndex = 2;

      if (startDate) {
        balanceHistoryQuery += ` AND created_at >= $${paramIndex}`;
        balanceParams.push(new Date(startDate));
        paramIndex++;
      }

      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        balanceHistoryQuery += ` AND created_at <= $${paramIndex}`;
        balanceParams.push(endDateTime);
        paramIndex++;
      }

      balanceHistoryQuery += ` ORDER BY created_at DESC`;

      const balanceHistory = await db.rawQueryAll<any>(
        balanceHistoryQuery,
        ...balanceParams
      );

      // Get transaction history (purchases)
      let transactionQuery = `
        SELECT 
          t.id,
          t.created_at,
          t.price,
          t.game_id,
          t.user_id as game_user_id,
          p.name as product_name,
          pkg.name as package_name,
          pkg.amount,
          pkg.unit
        FROM transactions t
        JOIN products p ON t.product_id = p.id
        JOIN packages pkg ON t.package_id = pkg.id
        WHERE t.clerk_user_id = $1 AND t.status = 'success'
      `;
      const transactionParams: any[] = [auth.userID];
      paramIndex = 2;

      if (startDate) {
        transactionQuery += ` AND t.created_at >= $${paramIndex}`;
        transactionParams.push(new Date(startDate));
        paramIndex++;
      }

      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        transactionQuery += ` AND t.created_at <= $${paramIndex}`;
        transactionParams.push(endDateTime);
        paramIndex++;
      }

      transactionQuery += ` ORDER BY t.created_at DESC`;

      const transactions = await db.rawQueryAll<any>(
        transactionQuery,
        ...transactionParams
      );

      // Combine and sort by date
      const combined: any[] = [];

      // Add balance history items
      balanceHistory.forEach((item) => {
        combined.push({
          id: `bh_${item.id}`,
          date: item.created_at,
          type: item.type,
          description: item.description,
          debit: item.amount,
          credit: 0,
          relatedData: {
            voucherCode: item.voucher_code,
          },
        });
      });

      // Add transaction items
      transactions.forEach((item) => {
        combined.push({
          id: `tx_${item.id}`,
          date: item.created_at,
          type: "purchase",
          description: `Pembelian ${item.amount} ${item.unit} ${item.product_name}`,
          debit: 0,
          credit: item.price,
          relatedData: {
            productName: item.product_name,
            packageName: item.package_name,
            gameId: item.game_user_id,
          },
        });
      });

      // Sort by date descending
      combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Calculate running balance
      let runningBalance = currentBalance;
      const history: UserTransactionHistoryItem[] = [];

      // Process from most recent to oldest
      for (const item of combined) {
        history.push({
          ...item,
          balance: runningBalance,
        });

        // Adjust balance for next (older) entry
        runningBalance = runningBalance - item.debit + item.credit;
      }

      console.log("Total history items:", history.length);

      return {
        history,
        currentBalance,
      };
    } catch (err) {
      console.error("Get transaction history error:", err);
      throw err;
    }
  }
);
