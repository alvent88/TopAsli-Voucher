import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { inquiryPayment } from "./client";

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
    
    const db = (await import("../db")).default;
    
    const pkg = await db.queryRow<{ 
      uniplay_entitas_id: string | null; 
      uniplay_denom_id: string | null; 
    }>`
      SELECT uniplay_entitas_id, uniplay_denom_id 
      FROM packages 
      WHERE id = ${packageId}
    `;

    if (!pkg || !pkg.uniplay_entitas_id || !pkg.uniplay_denom_id) {
      throw new Error("Package not found or missing UniPlay configuration");
    }

    const response = await inquiryPayment({
      entitas_id: pkg.uniplay_entitas_id,
      denom_id: pkg.uniplay_denom_id,
      user_id: userId,
      server_id: serverId,
    });

    if (response.status !== "200") {
      throw new Error(response.message || "Inquiry payment failed");
    }

    return {
      inquiryId: response.inquiry_id,
      username: response.inquiry_info?.username,
    };
  }
);
