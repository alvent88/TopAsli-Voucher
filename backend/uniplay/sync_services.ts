import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import db from "../db";
import { getVoucherList, getDTUList } from "./client";

export interface SyncServicesRequest {}

export interface SyncServicesResponse {
  success: boolean;
  synced: number;
  updated: number;
  errors: string[];
  voucherCount: number;
  gameCount: number;
}

export const syncServices = api<SyncServicesRequest, SyncServicesResponse>(
  { expose: true, method: "POST", path: "/uniplay/sync-pricelist", auth: true },
  async (req: SyncServicesRequest) => {
    const auth = getAuthData()!;
    
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Only admin can sync pricelist");
    }

    try {
      console.log("📥 Starting sync from UniPlay...");
      
      let synced = 0;
      let updated = 0;
      const errors: string[] = [];

      // ==================== SYNC VOUCHERS ====================
      console.log("\n=== Syncing Vouchers ===");
      
      const voucherResponse = await getVoucherList();
      
      if (voucherResponse.status !== "200" && voucherResponse.status !== "success") {
        throw new Error(`Failed to get voucher list: ${voucherResponse.message}`);
      }
      
      const vouchers = voucherResponse.list_voucher || [];
      console.log(`📦 Received ${vouchers.length} vouchers from UniPlay`);

      for (const voucher of vouchers) {
        try {
          const slug = `uniplay-voucher-${voucher.id.toLowerCase()}`;

          // Check if product exists by slug OR name
          const existing = await db.queryRow<{ id: number }>`
            SELECT id FROM products 
            WHERE slug = ${slug} OR name = ${voucher.name}
          `;

          let productId: number;
          let isNewProduct = false;

          if (existing) {
            // Update product
            await db.exec`
              UPDATE products 
              SET 
                name = ${voucher.name},
                category = ${'Voucher - ' + voucher.publisher},
                description = ${`Publisher: ${voucher.publisher_website}`},
                icon_url = ${voucher.image},
                updated_at = NOW()
              WHERE id = ${existing.id}
            `;
            productId = existing.id;
            updated++;
          } else {
            // Create new product
            const result = await db.queryRow<{ id: number }>`
              INSERT INTO products (name, slug, category, description, icon_url, is_active, created_at, updated_at)
              VALUES (
                ${voucher.name},
                ${slug},
                ${'Voucher - ' + voucher.publisher},
                ${`Publisher: ${voucher.publisher_website}`},
                ${voucher.image},
                true,
                NOW(),
                NOW()
              )
              RETURNING id
            `;
            
            if (!result) {
              throw new Error("Failed to create product");
            }
            
            productId = result.id;
            synced++;
            isNewProduct = true;
          }

          // Sync denominations as packages
          for (const denom of voucher.denom) {
            try {
              const price = parseInt(denom.price);
              
              // Check if package exists
              const pkgExists = await db.queryRow<{ id: number }>`
                SELECT id FROM packages 
                WHERE product_id = ${productId} 
                AND name = ${denom.package}
              `;
              
              if (pkgExists) {
                // Update package
                await db.exec`
                  UPDATE packages
                  SET 
                    price = ${price},
                    updated_at = NOW()
                  WHERE id = ${pkgExists.id}
                `;
              } else {
                // Create new package
                await db.exec`
                  INSERT INTO packages (product_id, name, amount, unit, price, is_active, created_at, updated_at)
                  VALUES (
                    ${productId}, 
                    ${denom.package}, 
                    1, 
                    'voucher', 
                    ${price}, 
                    true, 
                    NOW(), 
                    NOW()
                  )
                `;
              }
            } catch (err) {
              const errorMsg = `Failed to sync denom ${denom.package}: ${err instanceof Error ? err.message : String(err)}`;
              console.error(`    ✗ ${errorMsg}`);
              errors.push(errorMsg);
            }
          }
        } catch (err) {
          const errorMsg = `Failed to sync voucher ${voucher.name}: ${err instanceof Error ? err.message : String(err)}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      // ==================== SYNC DTU GAMES ====================
      console.log("\n=== Syncing DTU Games ===");
      
      const dtuResponse = await getDTUList();
      
      if (dtuResponse.status !== "200" && dtuResponse.status !== "success") {
        throw new Error(`Failed to get DTU game list: ${dtuResponse.message}`);
      }
      
      const games = dtuResponse.list_dtu || [];
      console.log(`🎮 Received ${games.length} games from UniPlay`);

      for (const game of games) {
        try {
          const slug = `uniplay-game-${game.id.toLowerCase()}`;

          // Check if product exists by slug OR name
          const existing = await db.queryRow<{ id: number }>`
            SELECT id FROM products 
            WHERE slug = ${slug} OR name = ${game.name}
          `;

          let productId: number;
          let isNewProduct = false;

          if (existing) {
            // Update product
            await db.exec`
              UPDATE products 
              SET 
                name = ${game.name},
                category = ${'Game - ' + game.publisher},
                description = ${`Publisher: ${game.publisher_website}`},
                icon_url = ${game.image},
                updated_at = NOW()
              WHERE id = ${existing.id}
            `;
            productId = existing.id;
            updated++;
          } else {
            // Create new product
            const result = await db.queryRow<{ id: number }>`
              INSERT INTO products (name, slug, category, description, icon_url, is_active, created_at, updated_at)
              VALUES (
                ${game.name},
                ${slug},
                ${'Game - ' + game.publisher},
                ${`Publisher: ${game.publisher_website}`},
                ${game.image},
                true,
                NOW(),
                NOW()
              )
              RETURNING id
            `;
            
            if (!result) {
              throw new Error("Failed to create product");
            }
            
            productId = result.id;
            synced++;
            isNewProduct = true;
          }

          // Sync denominations as packages
          for (const denom of game.denom) {
            try {
              const price = parseInt(denom.price);
              
              // Check if package exists
              const pkgExists = await db.queryRow<{ id: number }>`
                SELECT id FROM packages 
                WHERE product_id = ${productId} 
                AND name = ${denom.package}
              `;
              
              if (pkgExists) {
                // Update package
                await db.exec`
                  UPDATE packages
                  SET 
                    price = ${price},
                    updated_at = NOW()
                  WHERE id = ${pkgExists.id}
                `;
              } else {
                // Create new package
                await db.exec`
                  INSERT INTO packages (product_id, name, amount, unit, price, is_active, created_at, updated_at)
                  VALUES (
                    ${productId}, 
                    ${denom.package}, 
                    1, 
                    'item', 
                    ${price}, 
                    true, 
                    NOW(), 
                    NOW()
                  )
                `;
              }
            } catch (err) {
              const errorMsg = `Failed to sync denom ${denom.package}: ${err instanceof Error ? err.message : String(err)}`;
              console.error(`    ✗ ${errorMsg}`);
              errors.push(errorMsg);
            }
          }
        } catch (err) {
          const errorMsg = `Failed to sync game ${game.name}: ${err instanceof Error ? err.message : String(err)}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      console.log(`\n✅ Sync complete:`);
      console.log(`   - Vouchers: ${vouchers.length}`);
      console.log(`   - Games: ${games.length}`);
      console.log(`   - New products: ${synced}`);
      console.log(`   - Updated products: ${updated}`);
      console.log(`   - Errors: ${errors.length}`);

      return {
        success: true,
        synced,
        updated,
        errors,
        voucherCount: vouchers.length,
        gameCount: games.length,
      };
    } catch (err) {
      console.error("❌ Failed to sync:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      throw APIError.internal(`Failed to sync from UniPlay: ${errorMessage}`);
    }
  }
);
