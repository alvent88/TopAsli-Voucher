import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { getDTUList } from "./client";

export interface DebugUniPlayResponse {
  success: boolean;
  gamesCount: number;
  firstGame: any;
  firstGameDenoms: any[];
  rawResponse: any;
}

export const debugUniPlayResponse = api<void, DebugUniPlayResponse>(
  { expose: true, method: "GET", path: "/uniplay/debug-response", auth: true },
  async () => {
    const auth = getAuthData()!;
    
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Only admin can debug UniPlay");
    }

    console.log("=== DEBUGGING UNIPLAY RESPONSE ===");

    try {
      const response = await getDTUList();
      
      console.log("Full response:", JSON.stringify(response, null, 2));
      
      const firstGame = response.list_dtu[0];
      
      console.log("\n=== First Game Details ===");
      console.log("ID:", firstGame?.id);
      console.log("Name:", firstGame?.name);
      console.log("Publisher:", firstGame?.publisher);
      console.log("Image:", firstGame?.image);
      console.log("Denoms count:", firstGame?.denom?.length);
      
      if (firstGame?.denom && firstGame.denom.length > 0) {
        console.log("\n=== First Denom ===");
        console.log("ID:", firstGame.denom[0].id);
        console.log("Package:", firstGame.denom[0].package);
        console.log("Price:", firstGame.denom[0].price);
      }

      return {
        success: true,
        gamesCount: response.list_dtu?.length || 0,
        firstGame: firstGame || {},
        firstGameDenoms: firstGame?.denom || [],
        rawResponse: response,
      };
    } catch (err: any) {
      console.error("Debug error:", err);
      throw APIError.internal("Failed to debug UniPlay response: " + err.message);
    }
  }
);
