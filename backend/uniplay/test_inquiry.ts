import { api, APIError } from "encore.dev/api";
import { inquiryPayment, UniPlayInquiryPaymentResponse } from "./client";
import db from "../db";

export interface TestInquiryRequest {
  packageId: number;
  userId: string;
  serverId?: string;
}

export const testInquiry = api<TestInquiryRequest, UniPlayInquiryPaymentResponse>(
  { expose: true, method: "POST", path: "/uniplay/test-inquiry", auth: true },
  async (req: TestInquiryRequest) => {
    console.log("=== Test Inquiry ===");
    console.log("Package ID:", req.packageId);
    console.log("User ID:", req.userId);
    console.log("Server ID:", req.serverId);

    // Get package and product data from database
    const packageData = await db.queryRow<{
      package_id: number;
      package_name: string;
      product_id: number;
      product_name: string;
      uniplay_entitas_id: string | null;
      uniplay_denom_id: string | null;
    }>`
      SELECT 
        p.id as package_id,
        p.name as package_name,
        pr.id as product_id,
        pr.name as product_name,
        pr.uniplay_entitas_id,
        p.uniplay_denom_id
      FROM packages p
      INNER JOIN products pr ON p.product_id = pr.id
      WHERE p.id = ${req.packageId}
    `;

    if (!packageData) {
      throw APIError.notFound("Package not found");
    }

    if (!packageData.uniplay_entitas_id || !packageData.uniplay_denom_id) {
      throw APIError.invalidArgument(
        `Package "${packageData.package_name}" does not have UniPlay configuration. ` +
        `Entitas ID: ${packageData.uniplay_entitas_id || "N/A"}, ` +
        `Denom ID: ${packageData.uniplay_denom_id || "N/A"}`
      );
    }

    console.log("Product:", packageData.product_name);
    console.log("Package:", packageData.package_name);
    console.log("Entitas ID:", packageData.uniplay_entitas_id);
    console.log("Denom ID:", packageData.uniplay_denom_id);

    try {
      const response = await inquiryPayment({
        entitas_id: packageData.uniplay_entitas_id,
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
