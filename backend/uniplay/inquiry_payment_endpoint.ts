import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import { inquiryPayment, UniPlayInquiryPaymentResponse } from "./client";

export interface InquiryPaymentRequest {
  packageId: number;
  userId: string;
  serverId?: string;
}

export interface InquiryPaymentEndpointResponse {
  success: boolean;
  inquiryId: string;
  username?: string;
  message?: string;
  productName?: string;
  packageName?: string;
  price?: number;
}

export const inquiryPaymentEndpoint = api<InquiryPaymentRequest, InquiryPaymentEndpointResponse>(
  { expose: true, method: "POST", path: "/uniplay/inquiry-payment-endpoint", auth: true },
  async (req: InquiryPaymentRequest) => {
    const auth = getAuthData()!;

    try {
      console.log("=== Inquiry Payment Endpoint ===");
      console.log("User ID:", auth.userID);
      console.log("Package ID:", req.packageId);
      console.log("Game User ID:", req.userId);
      console.log("Server ID:", req.serverId);

      // Get package and product info from database
      const packageData = await db.queryRow<{
        package_id: number;
        package_name: string;
        package_price: number;
        product_id: number;
        product_name: string;
        uniplay_entitas_id: string | null;
        uniplay_denom_id: string | null;
      }>`
        SELECT 
          p.id as package_id,
          p.name as package_name,
          p.price as package_price,
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
          `Package "${packageData.package_name}" is not configured with UniPlay IDs. Please sync from UniPlay first.`
        );
      }

      console.log("Package info:", {
        name: packageData.package_name,
        price: packageData.package_price,
        product: packageData.product_name,
        entitas_id: packageData.uniplay_entitas_id.substring(0, 20) + "...",
        denom_id: packageData.uniplay_denom_id.substring(0, 20) + "...",
      });

      // Call UniPlay inquiry-payment API
      const inquiryRequest = {
        entitas_id: packageData.uniplay_entitas_id,
        denom_id: packageData.uniplay_denom_id,
        user_id: req.userId,
        server_id: req.serverId,
      };

      console.log("Calling UniPlay inquiry-payment...");
      const response = await inquiryPayment(inquiryRequest);

      console.log("UniPlay response:", JSON.stringify(response, null, 2));

      if (response.status !== "200") {
        throw APIError.internal(`UniPlay API error: ${response.message}`);
      }

      if (!response.inquiry_id) {
        throw APIError.internal("No inquiry_id in UniPlay response");
      }

      return {
        success: true,
        inquiryId: response.inquiry_id,
        username: response.inquiry_info?.username,
        productName: packageData.product_name,
        packageName: packageData.package_name,
        price: packageData.package_price,
        message: "Inquiry successful",
      };
    } catch (err: any) {
      console.error("❌ Inquiry payment failed:", err);
      
      if (err.code) {
        throw err;
      }
      
      throw APIError.internal(err.message || "Failed to inquiry payment");
    }
  }
);
