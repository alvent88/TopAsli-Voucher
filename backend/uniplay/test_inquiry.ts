import { api, APIError } from "encore.dev/api";
import { inquiryPayment, UniPlayInquiryPaymentResponse } from "./client";
import db from "../db";

export interface TestInquiryRequest {
  userId: string;
  serverId?: string;
}

export const testInquiry = api<TestInquiryRequest, UniPlayInquiryPaymentResponse>(
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

    // Find 3 Diamonds package
    const packageData = await db.queryRow<{
      id: number;
      name: string;
      uniplay_denom_id: string | null;
    }>`
      SELECT id, name, uniplay_denom_id
      FROM packages
      WHERE product_id = ${product.id}
      AND (LOWER(name) LIKE '%3 diamond%' OR LOWER(name) LIKE '%3diamond%')
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

    try {
      const response = await inquiryPayment({
        entitas_id: product.uniplay_entitas_id,
        denom_id: packageData.uniplay_denom_id,
        user_id: req.userId,
        server_id: req.serverId,
      });

      console.log("✅ Response:", JSON.stringify(response, null, 2));
      return response;
    } catch (error: any) {
      console.error("❌ Error:", error);
      throw error;
    }
  }
);
