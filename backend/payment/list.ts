import { api } from "encore.dev/api";
import db from "../db";

export interface PaymentMethod {
  id: number;
  name: string;
  code: string;
  iconUrl: string | null;
  feePercent: number;
  feeFixed: number;
  isActive: boolean;
}

interface ListPaymentMethodsResponse {
  methods: PaymentMethod[];
}

// Retrieves all active payment methods.
export const list = api<void, ListPaymentMethodsResponse>(
  { expose: true, method: "GET", path: "/payment-methods" },
  async () => {
    const rows = await db.queryAll<any>`
      SELECT id, name, code, icon_url, fee_percent, fee_fixed, is_active
      FROM payment_methods
      WHERE is_active = true
      ORDER BY name
    `;

    const methods = rows.map((row) => ({
      id: row.id,
      name: row.name,
      code: row.code,
      iconUrl: row.icon_url,
      feePercent: row.fee_percent,
      feeFixed: row.fee_fixed,
      isActive: row.is_active,
    }));

    return { methods };
  }
);
