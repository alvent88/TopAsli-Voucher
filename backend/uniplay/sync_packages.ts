import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { getDTUList, getVoucherList } from "./client";
import db from "../db";

export interface SyncUniPlayPackagesRequest {
  productId: number;
  productSlug: string;
}

export interface SyncUniPlayPackagesResponse {
  success: boolean;
  synced: number;
  message: string;
}

export const syncUniPlayPackages = api<SyncUniPlayPackagesRequest, SyncUniPlayPackagesResponse>(
  { expose: true, method: "POST", path: "/uniplay/sync-packages", auth: true },
  async ({ productId, productSlug }) => {
    const auth = getAuthData()!;
    
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Only admin can sync UniPlay packages");
    }

    console.log("=== SYNCING UNIPLAY PACKAGES ===");
    console.log("Product ID:", productId);
    console.log("Product Slug:", productSlug);

    try {
      const dtuResponse = await getDTUList();
      
      if (dtuResponse.status !== "200") {
        throw APIError.internal("Failed to fetch DTU list from UniPlay");
      }

      const game = dtuResponse.list_dtu.find(
        (g) => g.name.toLowerCase().includes(productSlug.toLowerCase()) || 
               g.id.toLowerCase() === productSlug.toLowerCase()
      );

      if (!game) {
        return {
          success: false,
          synced: 0,
          message: `Game "${productSlug}" tidak ditemukan di UniPlay DTU list. Coba cari manual atau gunakan Voucher.`,
        };
      }

      console.log("Found game:", game.name, "ID:", game.id);
      console.log("Denoms count:", game.denom.length);

      let syncedCount = 0;

      for (const denom of game.denom) {
        const existingPackage = await db.queryRow<{ id: number }>`
          SELECT id FROM packages 
          WHERE product_id = ${productId} 
          AND uniplay_entitas_id = ${game.id} 
          AND uniplay_denom_id = ${denom.id}
        `;

        if (existingPackage) {
          await db.exec`
            UPDATE packages
            SET name = ${denom.package}, 
                price = ${parseInt(denom.price)},
                updated_at = NOW()
            WHERE id = ${existingPackage.id}
          `;
          console.log("Updated package:", denom.package);
        } else {
          await db.exec`
            INSERT INTO packages (
              product_id, name, amount, unit, price, 
              uniplay_entitas_id, uniplay_denom_id, is_active
            )
            VALUES (
              ${productId}, ${denom.package}, 1, 'Item', ${parseInt(denom.price)},
              ${game.id}, ${denom.id}, true
            )
          `;
          console.log("Created package:", denom.package);
        }
        
        syncedCount++;
      }

      return {
        success: true,
        synced: syncedCount,
        message: `Berhasil sync ${syncedCount} paket dari UniPlay untuk game "${game.name}"`,
      };

    } catch (err: any) {
      console.error("Sync packages error:", err);
      throw APIError.internal("Failed to sync packages: " + err.message, err);
    }
  }
);
