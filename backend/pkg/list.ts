import { api } from "encore.dev/api";
import db from "../db";

export interface Package {
  id: number;
  productId: number;
  name: string;
  amount: number;
  unit: string;
  price: number;
  discountPrice: number | null;
  isActive: boolean;
  isSpecialItem: boolean;
}

interface ListPackagesParams {
  productId: number;
}

interface ListPackagesResponse {
  packages: Package[];
}

// Retrieves all active packages for a product.
export const list = api<ListPackagesParams, ListPackagesResponse>(
  { expose: true, method: "GET", path: "/packages" },
  async ({ productId }) => {
    const rows = await db.queryAll<any>`
      SELECT id, product_id, name, amount, unit, price, discount_price, is_active, is_special_item
      FROM packages
      WHERE product_id = ${productId} AND is_active = true
      ORDER BY price
    `;

    const packages = rows.map((row) => ({
      id: row.id,
      productId: row.product_id,
      name: row.name,
      amount: row.amount,
      unit: row.unit,
      price: row.price,
      discountPrice: row.discount_price,
      isActive: row.is_active,
      isSpecialItem: row.is_special_item || false,
    }));

    return { packages };
  }
);
