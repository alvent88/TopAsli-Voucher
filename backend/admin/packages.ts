import { api } from "encore.dev/api";
import db from "../db";
import type { Package } from "../pkg/list";

interface ListAllPackagesResponse {
  packages: Package[];
}

export const listAllPackages = api<void, ListAllPackagesResponse>(
  { expose: true, method: "GET", path: "/admin/packages", auth: true },
  async () => {
    const rows = await db.queryAll<any>`
      SELECT p.id, p.product_id, p.name, p.amount, p.unit, p.price, p.discount_price, p.is_active, p.is_special_item
      FROM packages p
      INNER JOIN products pr ON p.product_id = pr.id
      WHERE pr.is_active = true
      ORDER BY p.product_id, p.price
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
