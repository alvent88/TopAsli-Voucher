import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { inquiryPayment } from "./client";
import db from "../db";

export interface TestInquiryMLResponse {
  success: boolean;
  rawRequest: {
    entitas_id: string;
    denom_id: string;
    user_id: string;
    server_id: string;
  };
  rawResponse: any;
  expectedFormat: {
    status: string;
    message: string;
    inquiry_id: string;
    inquiry_info?: {
      username?: string;
    };
  };
  isMatchingExpectedFormat: boolean;
}

export const testInquiryML = api<void, TestInquiryMLResponse>(
  { expose: true, method: "POST", path: "/uniplay/test-inquiry-ml", auth: true },
  async () => {
    const auth = getAuthData()!;
    
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Only admin can test inquiry");
    }

    console.log("=== TEST INQUIRY MOBILE LEGENDS ===");
    
    let mlPackage;
    try {
      mlPackage = await db.queryRow<{
        id: number;
        name: string;
        uniplay_entitas_id: string | null;
        uniplay_denom_id: string | null;
      }>`
        SELECT p.id, p.name, p.uniplay_entitas_id, p.uniplay_denom_id
        FROM packages p
        INNER JOIN products pr ON p.product_id = pr.id
        WHERE pr.name ILIKE '%Mobile Legends%'
        AND p.uniplay_denom_id IS NOT NULL
        LIMIT 1
      `;
    } catch (dbError: any) {
      console.error("Database query error:", dbError);
      throw APIError.internal("Failed to query package: " + dbError.message);
    }

    if (!mlPackage) {
      throw APIError.notFound("Mobile Legends package not found. Please sync from UniPlay first.");
    }

    if (!mlPackage.uniplay_entitas_id || !mlPackage.uniplay_denom_id) {
      throw APIError.invalidArgument("Package missing UniPlay configuration. Please sync from UniPlay.");
    }

    console.log("Found package:", mlPackage);

    const testRequest = {
      entitas_id: mlPackage.uniplay_entitas_id,
      denom_id: mlPackage.uniplay_denom_id,
      user_id: "235791720",
      server_id: "9227",
    };

    console.log("Test request:", testRequest);

    try {
      const response = await inquiryPayment(testRequest);
      
      console.log("=== INQUIRY RESPONSE ===");
      console.log(JSON.stringify(response, null, 2));

      const expectedFormat = {
        status: "200",
        message: "Success",
        inquiry_id: "INQUIRY ID RESULT",
        inquiry_info: {
          username: "jagoanneon (Note: Not Showing If Voucher)",
        },
      };

      const isMatchingExpectedFormat = 
        response.status === "200" &&
        typeof response.message === "string" &&
        typeof response.inquiry_id === "string" &&
        response.inquiry_id.length > 0;

      return {
        success: true,
        rawRequest: testRequest,
        rawResponse: response,
        expectedFormat,
        isMatchingExpectedFormat,
      };
    } catch (err: any) {
      console.error("Test inquiry failed:", err);
      throw APIError.internal("Test inquiry failed: " + err.message, err);
    }
  }
);
