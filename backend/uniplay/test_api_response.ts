import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { getDTUList } from "./client";

interface TestAPIResponseResponse {
  firstGame: any;
  firstGameKeys: string[];
  firstDenom: any;
  firstDenomKeys: string[];
}

export const testAPIResponse = api<void, TestAPIResponseResponse>(
  { expose: true, method: "GET", path: "/uniplay/test-api-response", auth: true },
  async () => {
    const auth = getAuthData()!;
    
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Only admin can test API response");
    }

    const response = await getDTUList();
    const firstGame = response.list_dtu[0];
    const firstDenom = firstGame?.denom[0];

    console.log("=== FIRST GAME RAW DATA ===");
    console.log(JSON.stringify(firstGame, null, 2));
    console.log("\n=== FIRST DENOM RAW DATA ===");
    console.log(JSON.stringify(firstDenom, null, 2));

    return {
      firstGame,
      firstGameKeys: Object.keys(firstGame || {}),
      firstDenom,
      firstDenomKeys: Object.keys(firstDenom || {}),
    };
  }
);
