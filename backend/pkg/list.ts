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
  uniplayEntitasId?: string | null;
  uniplayDenomId?: string | null;
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
    const globalDiscountRow = await db.queryRow<{ value: string }>`
      SELECT value FROM admin_config WHERE key = 'global_discount'
    `;

    let globalDiscountPercent = 0;
    if (globalDiscountRow) {
      try {
        globalDiscountPercent = parseFloat(globalDiscountRow.value);
      } catch (e) {
        globalDiscountPercent = 0;
      }
    }

    const rows = await db.queryAll<any>`
      SELECT id, product_id, name, amount, unit, price, discount_price, is_active, is_special_item, uniplay_denom_id
      FROM packages
      WHERE product_id = ${productId} AND is_active = true
      ORDER BY price
    `;

    const packages = rows.map((row) => {
      let finalDiscountPrice = row.discount_price;
      
      if (!finalDiscountPrice && globalDiscountPercent > 0) {
        finalDiscountPrice = Math.round(row.price * (100 - globalDiscountPercent) / 100);
      }
      
      return {
        id: row.id,
        productId: row.product_id,
        name: row.name,
        amount: row.amount,
        unit: row.unit,
        price: row.price,
        discountPrice: finalDiscountPrice,
        isActive: row.is_active,
        isSpecialItem: row.is_special_item || false,
        uniplayDenomId: row.uniplay_denom_id,
      };
    });

    return { packages };
  }
);
