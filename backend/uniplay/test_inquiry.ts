import { api, APIError } from "encore.dev/api";
import { inquiryPayment, UniPlayInquiryPaymentResponse } from "./client";
import db from "../db";

export interface TestInquiryRequest {
  userId: string;
  serverId?: string;
}

export interface TestInquiryResponse extends UniPlayInquiryPaymentResponse {
  curlCommand: string;
}

export const testInquiry = api<TestInquiryRequest, TestInquiryResponse>(
  { expose: true, method: "POST", path: "/uniplay/test-inquiry", auth: true },
  async (req: TestInquiryRequest) => {
    console.log("=== Test Inquiry - Mobile Legends 3 Diamonds ===");
    console.log("User ID:", req.userId);
    console.log("Server ID:", req.serverId);

    // Find Mobile Legends product
    const product = await db.queryRow<{
      id: number;
      name: string;
      uniplay_entitas_id: string | null;
    }>`
      SELECT id, name, uniplay_entitas_id
      FROM products
      WHERE LOWER(name) LIKE '%mobile legends%'
      AND uniplay_entitas_id IS NOT NULL
      AND is_active = true
      LIMIT 1
    `;

    if (!product) {
      throw APIError.notFound("Mobile Legends product not found in database");
    }

    if (!product.uniplay_entitas_id) {
      throw APIError.invalidArgument("Mobile Legends product does not have UniPlay Entitas ID");
    }

    console.log("Product found:", product.name);
    console.log("Entitas ID:", product.uniplay_entitas_id);

    // Find 3 Diamonds package (exact match)
    const packageData = await db.queryRow<{
      id: number;
      name: string;
      uniplay_denom_id: string | null;
    }>`
      SELECT id, name, uniplay_denom_id
      FROM packages
      WHERE product_id = ${product.id}
      AND name = '3 Diamonds'
      AND uniplay_denom_id IS NOT NULL
      AND is_active = true
      LIMIT 1
    `;

    if (!packageData) {
      throw APIError.notFound("3 Diamonds package not found for Mobile Legends");
    }

    if (!packageData.uniplay_denom_id) {
      throw APIError.invalidArgument("3 Diamonds package does not have UniPlay Denom ID");
    }

    console.log("Package found:", packageData.name);
    console.log("Denom ID:", packageData.uniplay_denom_id);

    // Get API key and base URL from config
    const config = await db.queryRow<{ value: string }>`
      SELECT value FROM admin_config WHERE key = 'dashboard_config'
    `;

    if (!config) {
      throw APIError.internal("UniPlay config not found");
    }

    const dashboardConfig = JSON.parse(config.value);
    const apiKey = dashboardConfig.uniplay?.apiKey || "";
    const baseUrl = dashboardConfig.uniplay?.baseUrl || "https://api-reseller.uniplay.id/v1";

    // Generate timestamp
    const now = new Date();
    const jakartaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    const timestamp = jakartaTime.toISOString().slice(0, 19).replace('T', ' ');

    // Build request body
    const requestBody: any = {
      api_key: apiKey,
      timestamp: timestamp,
      entitas_id: product.uniplay_entitas_id,
      denom_id: packageData.uniplay_denom_id,
      user_id: req.userId,
    };

    if (req.serverId) {
      requestBody.server_id = req.serverId;
    }

    const jsonString = JSON.stringify(requestBody);

    // Generate curl command
    const curlCommand = `curl -X POST "${baseUrl}/inquiry-payment" \\
  -H "Content-Type: application/json" \\
  -H "UPL-ACCESS-TOKEN: <akan-di-generate>" \\
  -H "UPL-SIGNATURE: <akan-di-generate>" \\
  -d '${jsonString}'`;

    try {
      const response = await inquiryPayment({
        entitas_id: product.uniplay_entitas_id,
        denom_id: packageData.uniplay_denom_id,
        user_id: req.userId,
        server_id: req.serverId,
      });

      console.log("✅ Response:", JSON.stringify(response, null, 2));
      
      return {
        ...response,
        curlCommand,
      };
    } catch (error: any) {
      console.error("❌ Error:", error);
      throw error;
    }
  }
);
