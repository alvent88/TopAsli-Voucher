import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import db from "../db";

export interface UpdateInquiryIdRequest {
  packageId: number;
  inquiryId: string;
}

export interface UpdateInquiryIdResponse {
  success: boolean;
  packageId: number;
  inquiryId: string;
}

export const updatePackageInquiryId = api<UpdateInquiryIdRequest, UpdateInquiryIdResponse>(
  { expose: true, method: "POST", path: "/admin/update-inquiry-id", auth: true },
  async (req: UpdateInquiryIdRequest) => {
    const auth = getAuthData()!;
    
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Only admin can update inquiry ID");
    }

    try {
      await db.exec`
        UPDATE packages 
        SET inquiry_id = ${req.inquiryId}, updated_at = NOW()
        WHERE id = ${req.packageId}
      `;

      console.log(`✅ Package ${req.packageId} inquiry_id updated to: ${req.inquiryId}`);

      return {
        success: true,
        packageId: req.packageId,
        inquiryId: req.inquiryId,
      };
    } catch (err) {
      console.error("❌ Failed to update inquiry ID:", err);
      throw APIError.internal(
        err instanceof Error ? err.message : "Failed to update inquiry ID"
      );
    }
  }
);
