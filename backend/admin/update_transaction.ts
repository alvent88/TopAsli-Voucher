import { api, APIError } from "encore.dev/api";
import db from "../db";

interface UpdateTransactionParams {
  id: string;
  status: string;
}

interface UpdateTransactionResponse {
  success: boolean;
}

export const updateTransaction = api<UpdateTransactionParams, UpdateTransactionResponse>(
  { expose: true, method: "PUT", path: "/admin/transactions/:id", auth: true },
  async ({ id, status }) => {
    const validStatuses = ["pending", "processing", "success", "failed"];
    if (!validStatuses.includes(status)) {
      throw APIError.invalidArgument("invalid status");
    }

    const result = await db.queryRow<any>`
      UPDATE transactions
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id
    `;

    if (!result) {
      throw APIError.notFound("transaction not found");
    }

    return { success: true };
  }
);
