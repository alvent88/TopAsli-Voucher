import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import { getBalance } from "../uniplay/client";

export interface GetUniPlayBalanceResponse {
  balance: number;
  status: string;
  message: string;
}

export const getUniplayBalance = api<void, GetUniPlayBalanceResponse>(
  { expose: true, method: "GET", path: "/admin/uniplay/balance", auth: true },
  async () => {
    const auth = getAuthData()!;
    
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Only admin can check UniPlay balance");
    }

    try {
      const response = await getBalance();
      
      return {
        balance: response.saldo,
        status: response.status,
        message: response.message,
      };
    } catch (error: any) {
      console.error("Failed to get UniPlay balance:", error);
      throw APIError.internal(error.message || "Failed to get UniPlay balance", error);
    }
  }
);
