import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import { getBalance as getUniPlayBalance, UniPlayBalanceResponse } from "./client";
import db from "../db";

export interface BalanceResponseWithCurl extends UniPlayBalanceResponse {
  curlCommand?: string;
}

export const getBalance = api<void, BalanceResponseWithCurl>(
  { expose: true, method: "GET", path: "/uniplay/balance", auth: true },
  async () => {
    const auth = getAuthData()!;
    
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Only admin can check balance");
    }

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
    
    const curlCommand = `curl --location '${baseUrl}/inquiry-saldo' \\
  --header 'Content-Type: application/json' \\
  --header 'UPL-ACCESS-TOKEN: FROM-GET-ACCESS-TOKEN' \\
  --header 'UPL-SIGNATURE: GENERATED SIGNATURE' \\
  --data '${requestBody}'`;

    const response = await getUniPlayBalance();
    
    return {
      ...response,
      curlCommand,
    };
  }
);
