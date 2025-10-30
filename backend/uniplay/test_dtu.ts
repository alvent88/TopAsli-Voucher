import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import { getDTUList } from "./client";
import db from "../db";

export interface TestDTUResponse {
  success: boolean;
  gameCount: number;
  productsSynced: number;
  packagesCreated: number;
  firstGame?: {
    id: string;
    name: string;
    denomCount: number;
  };
  rawResponse?: any;
  error?: string;
  curlCommand?: string;
}

export const testDTU = api<{}, TestDTUResponse>(
  { expose: true, method: "POST", path: "/uniplay/test-dtu", auth: true },
  async () => {
    const auth = getAuthData()!;
    
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Only admin can test DTU");
    }

    try {
      console.log("📥 Testing DTU list API and syncing to database...");
      
      // Get config for cURL generation
      const config = await db.queryRow<{ value: string }>`
        SELECT value FROM admin_config WHERE key = 'dashboard_config'
      `;
      
      const dashboardConfig = config ? JSON.parse(config.value) : null;
      const apiKey = dashboardConfig?.uniplay?.apiKey || "";
      const baseUrl = dashboardConfig?.uniplay?.baseUrl || "https://api-reseller.uniplay.id/v1";
      
      // Generate timestamp
      const now = new Date();
      const jakartaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
      const timestamp = jakartaTime.toISOString().slice(0, 19).replace('T', ' ');
      
      const requestBody = JSON.stringify({
        api_key: apiKey,
        timestamp: timestamp,
      });
      
      const curlCommand = `curl -X POST "${baseUrl}/inquiry-dtu" \\
  -H "Content-Type: application/json" \\
  -H "UPL-ACCESS-TOKEN: <akan-di-generate>" \\
  -H "UPL-SIGNATURE: <akan-di-generate>" \\
  -d '${requestBody}'`;
      
      const response = await getDTUList();
      
      console.log("Full response:", JSON.stringify(response, null, 2));

      if (response.status !== "200" && response.status !== "success") {
        return {
          success: false,
          gameCount: 0,
          productsSynced: 0,
          packagesCreated: 0,
          rawResponse: response,
          error: `API Error: ${response.message || response.status}`,
          curlCommand,
        };
      }

      const games = response.list_dtu || [];
      
      if (games.length === 0) {
        return {
          success: true,
          gameCount: 0,
          productsSynced: 0,
          packagesCreated: 0,
          rawResponse: response,
          curlCommand,
        };
      }

      // Sync DTU games to database
      let productsSynced = 0;
      let packagesCreated = 0;

      for (const game of games) {
        try {
          console.log(`\n=== Processing DTU game: ${game.name} ===`);
          console.log(`Game ID (entitas_id): ${game.id}`);
          
          const slug = `dtu-${game.id.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

          // Check if product exists by uniplay_entitas_id OR name
          const existing = await db.queryRow<{ id: number; uniplay_entitas_id: string | null }>`
            SELECT id, uniplay_entitas_id FROM products 
            WHERE uniplay_entitas_id = ${game.id} OR name = ${game.name}
          `;

          let productId: number;

          if (existing) {
            // Update product (update entitas_id if it was null or different)
            await db.exec`
              UPDATE products 
              SET 
                name = ${game.name},
                category = 'Direct Top Up',
                description = ${`Publisher: ${game.publisher}`},
                icon_url = ${game.image},
                uniplay_entitas_id = ${game.id},
                updated_at = NOW()
              WHERE id = ${existing.id}
            `;
            productId = existing.id;
            
            if (existing.uniplay_entitas_id === null || existing.uniplay_entitas_id !== game.id) {
              console.log(`✅ Updated product ID: ${productId} (added/updated entitas_id: ${game.id})`);
            } else {
              console.log(`✅ Updated product ID: ${productId}`);
            }
          } else {
            // Create new product
            const result = await db.queryRow<{ id: number }>`
              INSERT INTO products (name, slug, category, description, icon_url, is_active, uniplay_entitas_id, requires_server_id, created_at, updated_at)
              VALUES (
                ${game.name},
                ${slug},
                'Direct Top Up',
                ${`Publisher: ${game.publisher}`},
                ${game.image},
                true,
                ${game.id},
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
            productsSynced++;
            console.log(`✅ Created product ID: ${productId}`);
          }

          // Sync denominations as packages
          for (const denom of game.denom) {
            try {
              console.log(`  Processing denom: ${denom.package} (ID: ${denom.id})`);
              
              const price = parseInt(denom.price);
              
              // Check if package exists by uniplay_denom_id OR name
              const pkgExists = await db.queryRow<{ id: number; uniplay_denom_id: string | null }>`
                SELECT id, uniplay_denom_id FROM packages 
                WHERE product_id = ${productId} 
                AND (uniplay_denom_id = ${denom.id} OR name = ${denom.package})
              `;
              
              if (pkgExists) {
                // Update package (update denom_id and entitas_id if needed)
                await db.exec`
                  UPDATE packages
                  SET 
                    name = ${denom.package},
                    price = ${price},
                    uniplay_entitas_id = ${game.id},
                    uniplay_denom_id = ${denom.id},
                    updated_at = NOW()
                  WHERE id = ${pkgExists.id}
                `;
                
                if (pkgExists.uniplay_denom_id === null || pkgExists.uniplay_denom_id !== denom.id) {
                  console.log(`  ✅ Updated package ID: ${pkgExists.id} (added/updated denom_id: ${denom.id})`);
                } else {
                  console.log(`  ✅ Updated package ID: ${pkgExists.id}`);
                }
              } else {
                // Create new package
                await db.exec`
                  INSERT INTO packages (product_id, name, amount, unit, price, uniplay_entitas_id, uniplay_denom_id, is_active, created_at, updated_at)
                  VALUES (
                    ${productId}, 
                    ${denom.package}, 
                    1, 
                    'item', 
                    ${price},
                    ${game.id},
                    ${denom.id}, 
                    true, 
                    NOW(), 
                    NOW()
                  )
                `;
                packagesCreated++;
                console.log(`  ✅ Created package with denom_id: ${denom.id}`);
              }
            } catch (err) {
              console.error(`  ✗ Failed to sync denom ${denom.package}:`, err);
            }
          }
        } catch (err) {
          console.error(`✗ Failed to sync game ${game.name}:`, err);
        }
      }

      const firstGame = games[0];
      
      console.log(`\n✅ DTU Sync complete:`);
      console.log(`   - Games found: ${games.length}`);
      console.log(`   - Products synced: ${productsSynced}`);
      console.log(`   - Packages created: ${packagesCreated}`);
      
      return {
        success: true,
        gameCount: games.length,
        productsSynced,
        packagesCreated,
        firstGame: {
          id: firstGame.id,
          name: firstGame.name,
          denomCount: firstGame.denom?.length || 0,
        },
        rawResponse: response,
        curlCommand,
      };
    } catch (err) {
      console.error("❌ Test DTU failed:", err);
      return {
        success: false,
        gameCount: 0,
        productsSynced: 0,
        packagesCreated: 0,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
);
