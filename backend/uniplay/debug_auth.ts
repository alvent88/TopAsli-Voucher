import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import db from "../db";

export interface DebugResult {
  step: string;
  success: boolean;
  data?: any;
  error?: string;
}

export interface DebugAuthResponse {
  results: DebugResult[];
}

export const debugAuth = api<void, DebugAuthResponse>(
  { expose: true, method: "GET", path: "/uniplay/debug-auth", auth: true },
  async () => {
    const auth = getAuthData()!;
    
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Only admin can debug");
    }

    const results: DebugResult[] = [];

    try {
      const row = await db.queryRow<{ value: string }>`
        SELECT value FROM admin_config WHERE key = 'dashboard_config'
      `;

      if (!row) {
        results.push({ step: "Get Config", success: false, error: "Config not found" });
        return { results };
      }

      results.push({ step: "Get Config", success: true });

      const config = JSON.parse(row.value);
      const apiKey = config.uniplay?.apiKey || "";
      const baseUrl = config.uniplay?.baseUrl || "";

      results.push({ 
        step: "Parse Config", 
        success: true, 
        data: { 
          hasApiKey: !!apiKey, 
          apiKeyLength: apiKey.length,
          baseUrl 
        } 
      });

      const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
      results.push({ step: "Generate Timestamp", success: true, data: { timestamp } });

      const jsonArray = {
        api_key: apiKey,
        timestamp: timestamp,
      };
      
      const jsonString = JSON.stringify(jsonArray);
      const hmacKey = `${apiKey}|${jsonString}`;
      
      const encoder = new TextEncoder();
      const keyData = encoder.encode(hmacKey);
      const messageData = encoder.encode(jsonString);
      
      try {
        const cryptoKey = await crypto.subtle.importKey(
          'raw',
          keyData,
          { name: 'HMAC', hash: 'SHA-512' },
          false,
          ['sign']
        );
        
        results.push({ step: "Import Crypto Key", success: true });
        
        const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
        const signatureArray = Array.from(new Uint8Array(signatureBuffer));
        const signature = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        results.push({ 
          step: "Generate Signature", 
          success: true, 
          data: { signatureLength: signature.length, signaturePreview: signature.substring(0, 20) + "..." } 
        });

        const accessTokenUrl = `${baseUrl}/access-token`;
        results.push({ step: "Access Token URL", success: true, data: { url: accessTokenUrl } });

        try {
          const response = await fetch(accessTokenUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "UPL-SIGNATURE": signature,
            },
            body: JSON.stringify({
              api_key: apiKey,
              timestamp: timestamp,
            }),
          });

          const responseText = await response.text();
          
          results.push({ 
            step: "Call Access Token API", 
            success: response.ok,
            data: { 
              status: response.status, 
              statusText: response.statusText,
              body: responseText.substring(0, 200)
            }
          });

          if (response.ok) {
            try {
              const data = JSON.parse(responseText);
              results.push({ 
                step: "Parse Access Token Response", 
                success: true,
                data: { status: data.status, hasToken: !!data.data?.access_token }
              });
            } catch (e) {
              results.push({ 
                step: "Parse Access Token Response", 
                success: false,
                error: "Invalid JSON"
              });
            }
          }
        } catch (fetchError) {
          results.push({ 
            step: "Call Access Token API", 
            success: false,
            error: fetchError instanceof Error ? fetchError.message : String(fetchError)
          });
        }
      } catch (cryptoError) {
        results.push({ 
          step: "Generate Signature", 
          success: false,
          error: cryptoError instanceof Error ? cryptoError.message : String(cryptoError)
        });
      }

      return { results };
    } catch (err) {
      results.push({ 
        step: "General Error", 
        success: false,
        error: err instanceof Error ? err.message : String(err)
      });
      return { results };
    }
  }
);
