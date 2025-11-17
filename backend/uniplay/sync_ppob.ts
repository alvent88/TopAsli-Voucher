import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import db from "../db";

export interface SyncPPOBRequest {}

export interface PPOBDenom {
  id: string;
  package: string;
  price: string;
}

export interface PPOBProduct {
  id: string;
  name: string;
  image: string;
  publisher: string;
  publisher_website: string;
  denom: PPOBDenom[];
}

export interface PPOBResponse {
  status: string;
  message: string;
  list_ppob?: PPOBProduct[];
}

export interface SyncPPOBResponse {
  success: boolean;
  rawResponse: string;
  curlCommand: string;
  productsSynced?: number;
  packagesCreated?: number;
  errors?: string[];
}

export const syncPPOB = api<SyncPPOBRequest, SyncPPOBResponse>(
  { expose: true, method: "POST", path: "/uniplay/sync-ppob", auth: true },
  async (req: SyncPPOBRequest) => {
    const auth = getAuthData()!;
    
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Only admin can sync PPOB");
    }

    try {
      const configRow = await db.queryRow<{ value: string }>`
        SELECT value FROM admin_config WHERE key = 'dashboard_config'
      `;

      if (!configRow) {
        throw new Error("UniPlay API key not configured");
      }

      const config = JSON.parse(configRow.value);
      if (!config.uniplay?.apiKey || !config.uniplay?.baseUrl) {
        throw new Error("UniPlay API key not configured");
      }

      const now = new Date();
      const jakartaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
      const timestamp = jakartaTime.toISOString().slice(0, 19).replace('T', ' ');

      const jsonArray = {
        api_key: config.uniplay.apiKey,
        timestamp: timestamp,
      };

      const jsonString = JSON.stringify(jsonArray);

      const hmacKey = config.uniplay.apiKey + '|' + jsonString;
      const encoder = new TextEncoder();
      const keyData = encoder.encode(hmacKey);
      const messageData = encoder.encode(jsonString);

      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-512' },
        false,
        ['sign']
      );

      const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
      const signatureArray = Array.from(new Uint8Array(signatureBuffer));
      const accessTokenSignature = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const tokenResponse = await fetch(`${config.uniplay.baseUrl}/access-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "UPL-SIGNATURE": accessTokenSignature,
        },
        body: jsonString,
      });

      const tokenResponseText = await tokenResponse.text();

      if (!tokenResponse.ok) {
        throw new Error(`HTTP ${tokenResponse.status}: ${tokenResponseText}`);
      }

      const tokenData = JSON.parse(tokenResponseText);

      if (tokenData.status !== "200") {
        throw new Error(`API Error ${tokenData.status}: ${tokenData.message}`);
      }

      if (!tokenData.access_token) {
        throw new Error(`No access token in response: ${JSON.stringify(tokenData)}`);
      }

      const accessToken = tokenData.access_token;

      const ppobRequestBody = {
        api_key: config.uniplay.apiKey,
        timestamp: timestamp,
      };

      const ppobJsonString = JSON.stringify(ppobRequestBody);

      const ppobHmacKey = config.uniplay.apiKey + '|' + ppobJsonString;
      const ppobKeyData = encoder.encode(ppobHmacKey);
      const ppobMessageData = encoder.encode(ppobJsonString);

      const ppobCryptoKey = await crypto.subtle.importKey(
        'raw',
        ppobKeyData,
        { name: 'HMAC', hash: 'SHA-512' },
        false,
        ['sign']
      );

      const ppobSignatureBuffer = await crypto.subtle.sign('HMAC', ppobCryptoKey, ppobMessageData);
      const ppobSignatureArray = Array.from(new Uint8Array(ppobSignatureBuffer));
      const ppobSignature = ppobSignatureArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const ppobResponse = await fetch(`${config.uniplay.baseUrl}/inquiry-ppob`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "UPL-ACCESS-TOKEN": accessToken,
          "UPL-SIGNATURE": ppobSignature,
        },
        body: ppobJsonString,
      });

      const ppobResponseText = await ppobResponse.text();

      const curlCommand = `curl --location 'https://api-reseller.uniplay.id/v1/inquiry-ppob' \\
--header 'UPL-ACCESS-TOKEN: FROM-GET-ACCESS-TOKEN' \\
--header 'UPL-SIGNATURE: GENERATED SIGNATURE' \\
--data '{"api_key":"YOUR API KEY","timestamp":"YYYY-MM-DD hh:mm:ss"}'`;

      if (!ppobResponse.ok) {
        return {
          success: false,
          rawResponse: ppobResponseText,
          curlCommand: curlCommand,
        };
      }

      let ppobData: PPOBResponse;
      try {
        ppobData = JSON.parse(ppobResponseText);
      } catch (parseErr) {
        return {
          success: false,
          rawResponse: `Parse error: ${ppobResponseText}`,
          curlCommand: curlCommand,
        };
      }

      if (ppobData.status !== "200" && ppobData.status !== "success") {
        return {
          success: false,
          rawResponse: ppobResponseText,
          curlCommand: curlCommand,
        };
      }

      const ppobProducts = ppobData.list_ppob || [];
      let productsSynced = 0;
      let packagesCreated = 0;
      const errors: string[] = [];

      for (const ppob of ppobProducts) {
        try {
          const slug = `uniplay-ppob-${ppob.id.toLowerCase()}`;

          const existing = await db.queryRow<{ id: number }>`
            SELECT id FROM products 
            WHERE slug = ${slug} OR name = ${ppob.name}
          `;

          let productId: number;

          if (existing) {
            await db.exec`
              UPDATE products 
              SET 
                name = ${ppob.name},
                category = ${'PPOB - ' + ppob.publisher},
                description = ${`Publisher: ${ppob.publisher_website}`},
                icon_url = ${ppob.image},
                uniplay_entitas_id = ${ppob.id},
                requires_server_id = false,
                updated_at = NOW()
              WHERE id = ${existing.id}
            `;
            productId = existing.id;
          } else {
            const result = await db.queryRow<{ id: number }>`
              INSERT INTO products (name, slug, category, description, icon_url, is_active, uniplay_entitas_id, requires_server_id, created_at, updated_at)
              VALUES (
                ${ppob.name},
                ${slug},
                ${'PPOB - ' + ppob.publisher},
                ${`Publisher: ${ppob.publisher_website}`},
                ${ppob.image},
                true,
                ${ppob.id},
                false,
                NOW(),
                NOW()
              )
              RETURNING id
            `;
            
            if (!result) {
              throw new Error("Failed to create PPOB product");
            }
            
            productId = result.id;
            productsSynced++;
          }

          for (const denom of ppob.denom) {
            try {
              const price = parseInt(denom.price);
              
              const pkgExists = await db.queryRow<{ id: number }>`
                SELECT id FROM packages 
                WHERE product_id = ${productId} 
                AND name = ${denom.package}
              `;
              
              if (pkgExists) {
                await db.exec`
                  UPDATE packages
                  SET 
                    price = ${price},
                    uniplay_entitas_id = ${ppob.id},
                    uniplay_denom_id = ${denom.id},
                    updated_at = NOW()
                  WHERE id = ${pkgExists.id}
                `;
              } else {
                await db.exec`
                  INSERT INTO packages (product_id, name, amount, unit, price, uniplay_entitas_id, uniplay_denom_id, is_active, created_at, updated_at)
                  VALUES (
                    ${productId}, 
                    ${denom.package}, 
                    1, 
                    'ppob', 
                    ${price},
                    ${ppob.id},
                    ${denom.id}, 
                    true, 
                    NOW(), 
                    NOW()
                  )
                `;
                packagesCreated++;
              }
            } catch (err) {
              const errorMsg = `Failed to sync denom ${denom.package}: ${err instanceof Error ? err.message : String(err)}`;
              errors.push(errorMsg);
            }
          }
        } catch (err) {
          const errorMsg = `Failed to sync PPOB ${ppob.name}: ${err instanceof Error ? err.message : String(err)}`;
          errors.push(errorMsg);
        }
      }

      return {
        success: true,
        rawResponse: ppobResponseText,
        curlCommand: curlCommand,
        productsSynced,
        packagesCreated,
        errors,
      };
    } catch (err) {
      console.error("❌ Failed to sync PPOB:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      throw APIError.internal(`Failed to sync PPOB: ${errorMessage}`);
    }
  }
);
