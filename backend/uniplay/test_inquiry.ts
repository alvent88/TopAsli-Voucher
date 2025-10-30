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

    // Find Mobile Legends:Bang Bang product by exact name
    const product = await db.queryRow<{
      id: number;
      name: string;
      uniplay_entitas_id: string | null;
    }>`
      SELECT id, name, uniplay_entitas_id
      FROM products
      WHERE name = 'Mobile Legends:Bang Bang'
      AND uniplay_entitas_id IS NOT NULL
      AND is_active = true
      LIMIT 1
    `;

    if (!product) {
      throw APIError.notFound("Mobile Legends:Bang Bang product not found in database. Please run DTU sync first.");
    }

    if (!product.uniplay_entitas_id) {
      throw APIError.invalidArgument("Mobile Legends:Bang Bang product does not have UniPlay Entitas ID");
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

    // Generate curl command with proper format
    const curlCommand = `curl --location '${baseUrl}/inquiry-payment' \\
  --header 'Content-Type: application/json' \\
  --header 'UPL-ACCESS-TOKEN: FROM-GET-ACCESS-TOKEN' \\
  --header 'UPL-SIGNATURE: GENERATED SIGNATURE' \\
  --data '${jsonString}'`;

    try {
      const response = await inquiryPayment({
        entitas_id: product.uniplay_entitas_id,
        denom_id: packageData.uniplay_denom_id,
        user_id: req.userId,
        server_id: req.serverId,
      });

      console.log("=== UniPlay Response Detail ===");
      console.log("Full Response:", JSON.stringify(response, null, 2));
      console.log("status:", response.status);
      console.log("message:", response.message);
      console.log("inquiry_id:", response.inquiry_id);
      console.log("inquiry_info:", response.inquiry_info);
      console.log("username:", response.inquiry_info?.username);
      
      const finalResponse = {
        status: response.status,
        message: response.message,
        inquiry_id: response.inquiry_id,
        inquiry_info: response.inquiry_info,
        curlCommand,
      };
      
      console.log("=== Final Response to Frontend ===");
      console.log(JSON.stringify(finalResponse, null, 2));
      
      return finalResponse;
    } catch (error: any) {
      console.error("❌ Error:", error);
      throw error;
    }
  }
);
