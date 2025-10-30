import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import { getDTUList } from "./client";
import db from "../db";

export interface TestDTUResponse {
  success: boolean;
  gameCount: number;
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
      console.log("📥 Testing DTU list API...");
      
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
          rawResponse: response,
          curlCommand,
        };
      }

      const firstGame = games[0];
      
      return {
        success: true,
        gameCount: games.length,
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
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
);
