import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import db from "../db";

export interface DeleteAllProductsRequest {}

export interface DeleteAllProductsResponse {
  success: boolean;
  deletedProducts: number;
  deletedPackages: number;
  deletedTransactions: number;
}

export const deleteAllProducts = api<DeleteAllProductsRequest, DeleteAllProductsResponse>(
  { expose: true, method: "POST", path: "/admin/delete-all-products", auth: true },
  async (req: DeleteAllProductsRequest) => {
    const auth = getAuthData()!;
    
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Only admin can delete all products");
    }

    try {
      console.log("🗑️ Starting delete all products, packages, and related transactions...");

      // Count first
      const transactions = await db.queryAll<{ id: string }>`SELECT id FROM transactions`;
      const txCount = transactions.length;
      
      const packages = await db.queryAll<{ id: number }>`SELECT id FROM packages`;
      const pkgCount = packages.length;
      
      const products = await db.queryAll<{ id: number }>`SELECT id FROM products`;
      const prodCount = products.length;
      
      console.log(`Found ${txCount} transactions, ${pkgCount} packages, ${prodCount} products to delete`);

      // Delete in order: transactions -> packages -> products
      await db.exec`DELETE FROM transactions`;
      console.log(`✅ Deleted ${txCount} transactions`);

      await db.exec`DELETE FROM packages`;
      console.log(`✅ Deleted ${pkgCount} packages`);

      await db.exec`DELETE FROM products`;
      console.log(`✅ Deleted ${prodCount} products`);

      return {
        success: true,
        deletedProducts: prodCount,
        deletedPackages: pkgCount,
        deletedTransactions: txCount,
      };
    } catch (err) {
      console.error("❌ Failed to delete all products:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      throw APIError.internal(`Failed to delete all products: ${errorMessage}`);
    }
  }
);
