import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { getDTUList } from "./client";
import db from "../db";

export interface SyncAllProductsResponse {
  success: boolean;
  productsCreated: number;
  packagesCreated: number;
  message: string;
}

export const syncAllProducts = api<void, SyncAllProductsResponse>(
  { expose: true, method: "POST", path: "/uniplay/sync-all-products", auth: true },
  async () => {
    const auth = getAuthData()!;
    
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Only admin can sync all products");
    }

    console.log("=== SYNCING ALL PRODUCTS FROM UNIPLAY ===");

    try {
      console.log("Step 1: Deleting all existing packages...");
      await db.exec`DELETE FROM packages`;
      
      console.log("Step 2: Deleting all existing products...");
      await db.exec`DELETE FROM products`;
      
      console.log("Step 3: Fetching DTU list from UniPlay...");
      const dtuResponse = await getDTUList();
      
      if (dtuResponse.status !== "200") {
        throw APIError.internal("Failed to fetch DTU list from UniPlay");
      }

      console.log(`Found ${dtuResponse.list_dtu.length} games from UniPlay`);

      let productsCreated = 0;
      let packagesCreated = 0;

      for (const game of dtuResponse.list_dtu) {
        console.log(`\nProcessing game: ${game.name} (${game.id})`);
        
        const slug = game.id.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        
        const productRow = await db.queryRow<{ id: number }>`
          INSERT INTO products (name, slug, category, icon_url, description, is_active)
          VALUES (
            ${game.name},
            ${slug},
            'Game',
            ${game.image || null},
            ${`Top up ${game.name} - Publisher: ${game.publisher}`},
            true
          )
          RETURNING id
        `;

        if (!productRow) {
          console.error(`Failed to create product for ${game.name}`);
          continue;
        }

        productsCreated++;
        console.log(`✅ Created product: ${game.name} (ID: ${productRow.id})`);

        for (const denom of game.denom) {
          await db.exec`
            INSERT INTO packages (
              product_id, name, amount, unit, price,
              uniplay_entitas_id, uniplay_denom_id, is_active
            )
            VALUES (
              ${productRow.id},
              ${denom.package},
              1,
              'Item',
              ${parseInt(denom.price)},
              ${game.id},
              ${denom.id},
              true
            )
          `;
          packagesCreated++;
          console.log(`  ✅ Created package: ${denom.package} - Rp ${denom.price}`);
        }
      }

      const message = `Sync completed! Created ${productsCreated} products and ${packagesCreated} packages from UniPlay DTU API.`;
      console.log("\n" + message);

      return {
        success: true,
        productsCreated,
        packagesCreated,
        message,
      };

    } catch (err: any) {
      console.error("Sync all products error:", err);
      throw APIError.internal("Failed to sync all products: " + err.message, err);
    }
  }
);
