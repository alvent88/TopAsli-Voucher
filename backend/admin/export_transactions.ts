import { api } from "encore.dev/api";
import db from "../db";
import { createClerkClient } from "@clerk/backend";
import { secret } from "encore.dev/config";

const clerkSecretKey = secret("ClerkSecretKey");
const clerkClient = createClerkClient({ secretKey: clerkSecretKey() });

interface ExportTransactionsResponse {
  data: Array<{
    id: string;
    transactionDate: string;
    userEmail: string;
    userId: string;
    gameId: string;
    username: string;
    productName: string;
    packageName: string;
    amount: number;
    price: number;
    fee: number;
    total: number;
    paymentMethod: string;
    status: string;
  }>;
}

export const exportTransactions = api<{}, ExportTransactionsResponse>(
  { expose: true, method: "GET", path: "/admin/transactions/export", auth: true },
  async () => {
    console.log("=== Exporting All Transactions ===");

    const query = `
      SELECT 
        t.id, 
        t.user_id, 
        t.game_id,
        t.username,
        t.amount, 
        t.price, 
        t.fee, 
        t.total, 
        t.status, 
        t.created_at, 
        t.clerk_user_id,
        p.name as product_name,
        pkg.name as package_name,
        pm.name as payment_method_name
      FROM transactions t
      JOIN products p ON t.product_id = p.id
      JOIN packages pkg ON t.package_id = pkg.id
      JOIN payment_methods pm ON t.payment_method_id = pm.id
      ORDER BY t.created_at DESC
    `;

    const rows = await db.rawQueryAll<any>(query);

    console.log(`Found ${rows.length} transactions to export`);

    const data = await Promise.all(rows.map(async (row) => {
      let userEmail = "N/A";
      
      if (row.clerk_user_id) {
        try {
          const user = await clerkClient.users.getUser(row.clerk_user_id);
          userEmail = user.emailAddresses[0]?.emailAddress || "N/A";
        } catch (err) {
          console.error(`Failed to get email for user ${row.clerk_user_id}:`, err);
        }
      }

      return {
        id: row.id,
        transactionDate: new Date(row.created_at).toLocaleString('id-ID', {
          dateStyle: 'medium',
          timeStyle: 'medium'
        }),
        userEmail,
        userId: row.user_id,
        gameId: row.game_id || "N/A",
        username: row.username || "N/A",
        productName: row.product_name,
        packageName: row.package_name,
        amount: row.amount,
        price: row.price,
        fee: row.fee,
        total: row.total,
        paymentMethod: row.payment_method_name,
        status: row.status,
      };
    }));

    console.log(`✅ Export complete: ${data.length} transactions`);

    return { data };
  }
);
