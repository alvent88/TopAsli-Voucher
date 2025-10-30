import { api, APIError } from "encore.dev/api";
import { inquiryPayment, UniPlayInquiryPaymentResponse } from "./client";
import db from "../db";

export interface TestVoucherInquiryResponse extends UniPlayInquiryPaymentResponse {
  curlCommand: string;
}

export const testVoucherInquiry = api<{}, TestVoucherInquiryResponse>(
  { expose: true, method: "POST", path: "/uniplay/test-voucher-inquiry", auth: true },
  async () => {
    console.log("=== Test Voucher Inquiry - Roblox Gift Card IDR 50K ===");

    // Find Roblox product by name
    const product = await db.queryRow<{
      id: number;
      name: string;
      category: string;
      uniplay_entitas_id: string | null;
    }>`
      SELECT id, name, category, uniplay_entitas_id
      FROM products
      WHERE name ILIKE '%Roblox%'
      AND uniplay_entitas_id IS NOT NULL
      AND is_active = true
      LIMIT 1
    `;

    if (!product) {
      throw APIError.notFound("Roblox product not found in database. Please run Voucher sync first.");
    }

    if (!product.uniplay_entitas_id) {
      throw APIError.invalidArgument("Roblox product does not have UniPlay Entitas ID");
    }

    console.log("Product found:", product.name);
    console.log("Category:", product.category);
    console.log("Entitas ID:", product.uniplay_entitas_id);

    // Find Roblox Gift Card IDR 50K package
    const packageData = await db.queryRow<{
      id: number;
      name: string;
      price: number;
      uniplay_denom_id: string | null;
    }>`
      SELECT id, name, price, uniplay_denom_id
      FROM packages
      WHERE product_id = ${product.id}
      AND name ILIKE '%50K%'
      AND uniplay_denom_id IS NOT NULL
      AND is_active = true
      LIMIT 1
    `;

    if (!packageData) {
      throw APIError.notFound("Roblox Gift Card IDR 50K package not found");
    }

    if (!packageData.uniplay_denom_id) {
      throw APIError.invalidArgument("Roblox Gift Card IDR 50K package does not have UniPlay Denom ID");
    }

    console.log("Package found:", packageData.name);
    console.log("Price:", packageData.price);
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

    // Build request body - voucher doesn't need user_id and server_id
    const requestBody = {
      api_key: apiKey,
      timestamp: timestamp,
      entitas_id: product.uniplay_entitas_id,
      denom_id: packageData.uniplay_denom_id,
    };

    const jsonString = JSON.stringify(requestBody);

    // Generate curl command
    const curlCommand = `curl --location '${baseUrl}/inquiry-payment' \\
  --header 'Content-Type: application/json' \\
  --header 'UPL-ACCESS-TOKEN: FROM-GET-ACCESS-TOKEN' \\
  --header 'UPL-SIGNATURE: GENERATED-SIGNATURE' \\
  --data '${jsonString}'`;

    try {
      // Call UniPlay inquiry-payment without user_id and server_id
      const response = await inquiryPayment({
        entitas_id: product.uniplay_entitas_id,
        denom_id: packageData.uniplay_denom_id,
      });

      console.log("=== UniPlay Response Detail ===");
      console.log("Full Response:", JSON.stringify(response, null, 2));
      console.log("status:", response.status);
      console.log("message:", response.message);
      console.log("inquiry_id:", response.inquiry_id);
      
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
