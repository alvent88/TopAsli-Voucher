import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { inquiryPayment } from "./client";
import db from "../db";

export interface InquiryPaymentRequest {
  packageId: number;
  userId?: string;
  serverId?: string;
}

export interface InquiryPaymentResponse {
  inquiryId: string;
  username?: string;
}

export const inquiryPaymentEndpoint = api<InquiryPaymentRequest, InquiryPaymentResponse>(
  { expose: true, method: "POST", path: "/uniplay/inquiry-payment", auth: true },
  async ({ packageId, userId, serverId }) => {
    const auth = getAuthData()!;
    
    console.log("=== INQUIRY PAYMENT REQUEST ===");
    console.log("Package ID:", packageId);
    console.log("User ID:", userId);
    console.log("Server ID:", serverId);
    
    const pkg = await db.queryRow<{ 
      uniplay_entitas_id: string | null; 
      uniplay_denom_id: string | null; 
    }>`
      SELECT uniplay_entitas_id, uniplay_denom_id 
      FROM packages 
      WHERE id = ${packageId}
    `;

    console.log("Package query result:", pkg);

    if (!pkg) {
      throw APIError.invalidArgument("Package not found");
    }

    if (!pkg.uniplay_entitas_id || !pkg.uniplay_denom_id) {
      console.log("⚠️ Package missing UniPlay IDs - skipping inquiry payment");
      return {
        inquiryId: "",
        username: undefined,
      };
    }

    console.log("✅ Package has UniPlay config:");
    console.log("  - Entitas ID:", pkg.uniplay_entitas_id);
    console.log("  - Denom ID:", pkg.uniplay_denom_id);

    try {
      const response = await inquiryPayment({
        entitas_id: pkg.uniplay_entitas_id,
        denom_id: pkg.uniplay_denom_id,
        user_id: userId,
        server_id: serverId,
      });

      console.log("=== UNIPLAY INQUIRY RAW RESPONSE ===");
      console.log(JSON.stringify(response, null, 2));
      console.log("=== RESPONSE DETAILS ===");
      console.log("Status:", response.status);
      console.log("Message:", response.message);
      console.log("Inquiry ID:", response.inquiry_id);
      console.log("Inquiry Info exists?", !!response.inquiry_info);
      console.log("Inquiry Info:", JSON.stringify(response.inquiry_info, null, 2));
      console.log("Username from inquiry_info:", response.inquiry_info?.username);

      if (response.status !== "200") {
        throw APIError.invalidArgument(response.message || "Inquiry payment failed");
      }

      console.log("✅ Inquiry successful!");
      console.log("  - Inquiry ID:", response.inquiry_id);
      console.log("  - Username:", response.inquiry_info?.username || "NOT FOUND");

      return {
        inquiryId: response.inquiry_id,
        username: response.inquiry_info?.username,
      };
    } catch (err: any) {
      console.error("Inquiry payment error:", err);
      throw APIError.internal("Failed to inquiry payment: " + err.message, err);
    }
  }
);
