import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface GetUserBalanceResponse {
  balance: number;
}

export const getUserBalance = api<void, GetUserBalanceResponse>(
  { expose: true, method: "GET", path: "/balance/get", auth: true },
  async () => {
    const auth = getAuthData()!;

    const userBalance = await db.queryRow<{ balance: number }>`
      SELECT balance FROM user_balance WHERE user_id = ${auth.userID}
    `;

    return {
      balance: userBalance?.balance || 0,
    };
  }
);
