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
      console.log(`  All packages deleted`);
      
      console.log("Step 2: Deleting all existing products...");
      await db.exec`DELETE FROM products`;
      console.log(`  All products deleted`);
      
      console.log("Step 3: Fetching DTU list from UniPlay...");
      const dtuResponse = await getDTUList();
      
      if (dtuResponse.status !== "200") {
        throw APIError.internal("Failed to fetch DTU list from UniPlay");
      }

      console.log(`Found ${dtuResponse.list_dtu.length} games from UniPlay`);

      let productsCreated = 0;
      let packagesCreated = 0;

      for (const game of dtuResponse.list_dtu) {
        console.log(`\n=== Processing game: ${game.name} ===`);
        console.log(`RAW GAME DATA:`, JSON.stringify(game, null, 2));
        console.log(`Game ID (will be entitas_id): ${game.id}`);
        console.log(`Game ID type: ${typeof game.id}`);
        console.log(`Denoms count: ${game.denom.length}`);
        
        const slug = game.id.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        
        console.log(`Inserting product with:`);
        console.log(`  - name: ${game.name}`);
        console.log(`  - slug: ${slug}`);
        console.log(`  - uniplay_entitas_id: ${game.id}`);
        
        const productRow = await db.queryRow<{ id: number }>`
          INSERT INTO products (name, slug, category, icon_url, description, is_active, uniplay_entitas_id)
          VALUES (
            ${game.name},
            ${slug},
            'Game',
            ${game.image || null},
            ${`Top up ${game.name} - Publisher: ${game.publisher}`},
            true,
            ${game.id}
          )
          RETURNING id
        `;

        if (!productRow) {
          console.error(`❌ Failed to create product for ${game.name}`);
          continue;
        }

        productsCreated++;
        console.log(`✅ Product created with ID: ${productRow.id}`);
        
        // Verify product was saved with entitas_id
        const verifyProduct = await db.queryRow<{ uniplay_entitas_id: string | null }>`
          SELECT uniplay_entitas_id FROM products WHERE id = ${productRow.id}
        `;
        console.log(`  Verification - Product uniplay_entitas_id: ${verifyProduct?.uniplay_entitas_id || 'NULL'}`);

        for (const denom of game.denom) {
          console.log(`\n  --- Creating package: ${denom.package} ---`);
          console.log(`    RAW DENOM DATA:`, JSON.stringify(denom, null, 2));
          console.log(`    Denom ID: ${denom.id}`);
          console.log(`    Denom ID type: ${typeof denom.id}`);
          console.log(`    Price: ${denom.price}`);
          console.log(`    Will insert with:`);
          console.log(`      - uniplay_entitas_id: ${game.id}`);
          console.log(`      - uniplay_denom_id: ${denom.id}`);
          
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
          
          // Verify package was saved
          const verifyPackage = await db.queryRow<{ 
            id: number;
            uniplay_entitas_id: string | null;
            uniplay_denom_id: string | null;
          }>`
            SELECT id, uniplay_entitas_id, uniplay_denom_id 
            FROM packages 
            WHERE product_id = ${productRow.id} AND name = ${denom.package}
          `;
          
          console.log(`    ✅ Package created with ID: ${verifyPackage?.id}`);
          console.log(`    Verification - entitas_id: ${verifyPackage?.uniplay_entitas_id || 'NULL'}`);
          console.log(`    Verification - denom_id: ${verifyPackage?.uniplay_denom_id || 'NULL'}`);
          
          packagesCreated++;
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
