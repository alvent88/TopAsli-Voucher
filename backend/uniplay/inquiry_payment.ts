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

    if (!pkg || !pkg.uniplay_entitas_id || !pkg.uniplay_denom_id) {
      throw APIError.invalidArgument("Package not found or missing UniPlay configuration. Please contact admin to configure UniPlay IDs for this package.");
    }

    try {
      const response = await inquiryPayment({
        entitas_id: pkg.uniplay_entitas_id,
        denom_id: pkg.uniplay_denom_id,
        user_id: userId,
        server_id: serverId,
      });

      console.log("UniPlay inquiry response:", response);

      if (response.status !== "200") {
        throw APIError.invalidArgument(response.message || "Inquiry payment failed");
      }

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
