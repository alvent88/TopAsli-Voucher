import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import { getBalance as getUniPlayBalance, UniPlayBalanceResponse } from "./client";

export const getBalance = api<void, UniPlayBalanceResponse>(
  { expose: true, method: "GET", path: "/uniplay/balance", auth: true },
  async () => {
    const auth = getAuthData()!;
    
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Only admin can check balance");
    }

    return await getUniPlayBalance();
  }
);
