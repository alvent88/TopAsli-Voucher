import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import db from "../db";

export interface TestConnectionResponse {
  success: boolean;
  message: string;
  responseCode?: string;
  curlCommand?: string;
}

export const testConnection = api<void, TestConnectionResponse>(
  { expose: true, method: "GET", path: "/uniplay/test", auth: true },
  async () => {
    const auth = getAuthData()!;
    
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Only admin can test connection");
    }

    try {
      // Get config
      const row = await db.queryRow<{ value: string }>`
        SELECT value FROM admin_config WHERE key = 'dashboard_config'
      `;

      if (!row) {
        throw new Error("UniPlay config not found");
      }

      const config = JSON.parse(row.value);
      if (!config.uniplay?.apiKey || !config.uniplay?.baseUrl) {
        throw new Error("UniPlay API key or base URL not configured");
      }

      const apiKey = config.uniplay.apiKey;
      const baseUrl = config.uniplay.baseUrl;

      console.log("=== Testing UniPlay Connection ===");
      console.log("Base URL:", baseUrl);
      console.log("API Key:", apiKey.substring(0, 10) + "...");

      // Generate timestamp (Jakarta timezone)
      const now = new Date();
      const jakartaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
      const timestamp = jakartaTime.toISOString().slice(0, 19).replace('T', ' ');
      
      console.log("Timestamp:", timestamp);

      // Generate signature
      const jsonArray = { api_key: apiKey, timestamp: timestamp };
      const jsonString = JSON.stringify(jsonArray);
      const hmacKey = `${apiKey}|${jsonString}`;
      
      console.log("JSON String:", jsonString);
      
      // Generate cURL command
      const curlCommand = `curl -X POST "${baseUrl}/access-token" \\
  -H "Content-Type: application/json" \\
  -H "UPL-SIGNATURE: <akan-di-generate>" \\
  -d '${jsonString}'`;
      
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
      const signature = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      console.log("Signature:", signature.substring(0, 40) + "...");

      // Call /access-token
      const url = `${baseUrl}/access-token`;
      console.log("Calling:", url);
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "UPL-SIGNATURE": signature,
        },
        body: JSON.stringify({ api_key: apiKey, timestamp: timestamp }),
      });

      console.log("HTTP Status:", response.status);
      
      const responseText = await response.text();
      console.log("Response:", responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Invalid JSON response: ${responseText}`);
      }

      // Check response code
      if (data.status === "200" || data.status === 200 || data.status === "success") {
        return {
          success: true,
          message: "✅ Connection successful! " + (data.message || ""),
          responseCode: data.status,
          curlCommand,
        };
      } else {
        // Map error codes from documentation
        const errorMessages: Record<string, string> = {
          "300": "Invalid API Key",
          "400": "Invalid Signature",
          "500": "Signature Header Not Found",
          "600": "Request Expired / Timestamp Timeout",
          "700": "Access Token Header Not Found",
          "2000": "Invalid Access Token",
          "2100": "Not Register As Reseller / Expired",
          "2200": "Not Register As Lifetime Reseller",
        };

        const errorMsg = errorMessages[data.status] || data.message || "Unknown error";
        
        return {
          success: false,
          message: `❌ Error ${data.status}: ${errorMsg}`,
          responseCode: data.status,
          curlCommand,
        };
      }

    } catch (err) {
      console.error("❌ Test connection error:", err);
      throw APIError.internal(
        err instanceof Error ? err.message : "Unknown error occurred"
      );
    }
  }
);
