import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import db from "../db";

export interface SimpleTestResult {
  status: number;
  ok: boolean;
  headers: any;
  body: any;
}

export const simpleTest = api<void, SimpleTestResult>(
  { expose: true, method: "GET", path: "/uniplay/simple-test", auth: true },
  async () => {
    const auth = getAuthData()!;
    
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Only admin can test");
    }

    const row = await db.queryRow<{ value: string }>`
      SELECT value FROM admin_config WHERE key = 'dashboard_config'
    `;

    if (!row) {
      throw new Error("Config not found");
    }

    const config = JSON.parse(row.value);
    const apiKey = config.uniplay?.apiKey || "";
    const baseUrl = config.uniplay?.baseUrl || "";

    console.log("=== Simple Test (No Signature) ===");
    console.log("URL:", `${baseUrl}/inquiry-saldo`);
    console.log("API Key:", apiKey.substring(0, 10) + "...");

    try {
      const response = await fetch(`${baseUrl}/inquiry-saldo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "UPL-ACCESS-TOKEN": apiKey,
        },
        body: JSON.stringify({
          api_key: apiKey,
        }),
      });

      const responseText = await response.text();
      console.log("Response status:", response.status);
      console.log("Response body:", responseText);

      let parsedBody;
      try {
        parsedBody = JSON.parse(responseText);
      } catch (e) {
        parsedBody = responseText;
      }

      return {
        status: response.status,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
        body: parsedBody,
      };
    } catch (err) {
      console.error("Request error:", err);
      throw err;
    }
  }
);
