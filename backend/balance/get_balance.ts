import { api } from "encore.dev/api";
import db from "../db";

interface GetUserBalanceRequest {
  userId: string;
}

interface GetUserBalanceResponse {
  balance: number;
}

export const getUserBalance = api<GetUserBalanceRequest, GetUserBalanceResponse>(
  { expose: true, method: "GET", path: "/balance/get", auth: false },
  async ({ userId }) => {
    const userBalance = await db.queryRow<{ balance: number }>`
      SELECT balance FROM user_balance WHERE user_id = ${userId}
    `;

    return {
      balance: userBalance?.balance || 0,
    };
  }
);
