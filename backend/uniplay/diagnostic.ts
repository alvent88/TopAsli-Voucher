import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import db from "../db";

export interface DiagnosticResult {
  tests: Array<{
    url: string;
    status: number;
    ok: boolean;
    body: string;
  }>;
  recommendation: string;
}

export const diagnostic = api<void, DiagnosticResult>(
  { expose: true, method: "GET", path: "/uniplay/diagnostic", auth: true },
  async () => {
    const auth = getAuthData()!;
    
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Only admin can run diagnostic");
    }

    const row = await db.queryRow<{ value: string }>`
      SELECT value FROM admin_config WHERE key = 'dashboard_config'
    `;

    if (!row) {
      throw new Error("Config not found");
    }

    const config = JSON.parse(row.value);
    const apiKey = config.uniplay?.apiKey || "";

    const testConfigurations = [
      { base: "https://api-reseller.uniplay.id", endpoint: "/inquiry-saldo" },
      { base: "https://api-reseller.uniplay.id", endpoint: "/v1/inquiry-saldo" },
      { base: "https://api-reseller.uniplay.id/v1", endpoint: "/inquiry-saldo" },
      { base: "https://api-reseller.uniplay.id/api", endpoint: "/inquiry-saldo" },
      { base: "https://api-reseller.uniplay.id/api/v1", endpoint: "/inquiry-saldo" },
    ];

    const results: DiagnosticResult["tests"] = [];

    for (const testConfig of testConfigurations) {
      const fullUrl = `${testConfig.base}${testConfig.endpoint}`;
      console.log(`Testing: ${fullUrl}`);

      try {
        const response = await fetch(fullUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            api_key: apiKey,
          }),
        });

        const bodyText = await response.text();
        
        results.push({
          url: fullUrl,
          status: response.status,
          ok: response.ok,
          body: bodyText.substring(0, 200),
        });

        if (response.ok) {
          console.log(`✅ SUCCESS: ${fullUrl}`);
        }
      } catch (err) {
        results.push({
          url: fullUrl,
          status: 0,
          ok: false,
          body: err instanceof Error ? err.message : String(err),
        });
      }
    }

    const successfulTest = results.find(r => r.ok);
    const recommendation = successfulTest 
      ? `Use base URL: ${successfulTest.url.replace('/inquiry-saldo', '')}`
      : "No working URL found. Please contact UniPlay support for correct API endpoint.";

    return {
      tests: results,
      recommendation,
    };
  }
);
