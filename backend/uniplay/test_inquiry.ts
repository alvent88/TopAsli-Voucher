import { api } from "encore.dev/api";
import { inquiryPayment, UniPlayInquiryPaymentResponse } from "./client";

export interface TestInquiryRequest {
  entitasId: string;
  denomId: string;
  userId: string;
  serverId?: string;
}

export const testInquiry = api<TestInquiryRequest, UniPlayInquiryPaymentResponse>(
  { expose: true, method: "POST", path: "/uniplay/test-inquiry", auth: true },
  async (req: TestInquiryRequest) => {
    console.log("=== Test Inquiry ===");
    console.log("Entitas ID:", req.entitasId);
    console.log("Denom ID:", req.denomId);
    console.log("User ID:", req.userId);
    console.log("Server ID:", req.serverId);

    try {
      const response = await inquiryPayment({
        entitas_id: req.entitasId,
        denom_id: req.denomId,
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
