import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import { getDTUList } from "./client";

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
      
      const response = await getDTUList();
      
      console.log("Full response:", JSON.stringify(response, null, 2));

      if (response.status !== "200" && response.status !== "success") {
        return {
          success: false,
          gameCount: 0,
          rawResponse: response,
          error: `API Error: ${response.message || response.status}`,
        };
      }

      const games = response.list_dtu || [];
      
      if (games.length === 0) {
        return {
          success: true,
          gameCount: 0,
          rawResponse: response,
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
