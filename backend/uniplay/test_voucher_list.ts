import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import { getVoucherList } from "./client";

export interface TestVoucherListResponse {
  success: boolean;
  voucherCount: number;
  firstVoucher?: {
    id: string;
    name: string;
    denomCount: number;
  };
  error?: string;
}

export const testVoucherList = api<{}, TestVoucherListResponse>(
  { expose: true, method: "POST", path: "/uniplay/test-voucher-list", auth: true },
  async () => {
    const auth = getAuthData()!;
    
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Only admin can test voucher list");
    }

    try {
      console.log("📥 Testing voucher list API...");
      
      const response = await getVoucherList();
      
      console.log("Response status:", response.status);
      console.log("Response message:", response.message);
      console.log("Voucher count:", response.list_voucher?.length || 0);

      if (response.status !== "200" && response.status !== "success") {
        return {
          success: false,
          voucherCount: 0,
          error: `API Error: ${response.message || response.status}`,
        };
      }

      const vouchers = response.list_voucher || [];
      
      if (vouchers.length === 0) {
        return {
          success: true,
          voucherCount: 0,
        };
      }

      const firstVoucher = vouchers[0];
      
      return {
        success: true,
        voucherCount: vouchers.length,
        firstVoucher: {
          id: firstVoucher.id,
          name: firstVoucher.name,
          denomCount: firstVoucher.denom?.length || 0,
        },
      };
    } catch (err) {
      console.error("❌ Test voucher list failed:", err);
      return {
        success: false,
        voucherCount: 0,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
);
