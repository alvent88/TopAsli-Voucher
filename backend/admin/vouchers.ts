import { api, Header } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import db from "../db";
import { logAuditAction } from "../audit/logger";

export interface Voucher {
  code: string;
  amount: number;
  isActive: boolean;
  maxUses: number;
  usedCount: number;
  createdBy: string;
  createdAt: string;
  expiresAt: string | null;
  claimedByPhone: string | null;
  claimedAt: string | null;
}

export interface ListVouchersParams {
  search?: string;
  status?: "all" | "claimed" | "unclaimed";
}

export interface VoucherStatistics {
  totalCreated: number;
  totalClaimed: number;
  totalUnclaimed: number;
}

export interface ListVouchersResponse {
  vouchers: Voucher[];
  statistics: VoucherStatistics;
}

export const listVouchers = api<ListVouchersParams, ListVouchersResponse>(
  { expose: true, method: "GET", path: "/admin/vouchers", auth: true },
  async ({ search, status = "all" }) => {
    const auth = getAuthData()!;
    
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Only admin can list vouchers");
    }

    try {
      let whereConditions: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (search) {
        whereConditions.push(`(code ILIKE $${paramIndex} OR claimed_by_phone ILIKE $${paramIndex})`);
        params.push(`%${search}%`);
        paramIndex++;
      }

      if (status === "claimed") {
        whereConditions.push("claimed_by_user_id IS NOT NULL");
      } else if (status === "unclaimed") {
        whereConditions.push("claimed_by_user_id IS NULL");
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

      const query = `
        SELECT 
          code, 
          amount, 
          is_active, 
          max_uses, 
          used_count, 
          created_by, 
          created_at, 
          expires_at, 
          claimed_at,
          claimed_by_user_id,
          CASE 
            WHEN claimed_by_phone IS NOT NULL THEN claimed_by_phone
            WHEN claimed_by_user_id IS NOT NULL THEN 'User: ' || claimed_by_user_id
            ELSE NULL
          END as claimed_by_phone
        FROM vouchers
        ${whereClause}
        ORDER BY created_at DESC
      `;

      const rows = await db.rawQueryAll<any>(query, ...params);

      const vouchers: Voucher[] = rows.map(row => ({
        code: row.code,
        amount: row.amount,
        isActive: row.is_active,
        maxUses: row.max_uses,
        usedCount: row.used_count,
        createdBy: row.created_by,
        createdAt: row.created_at,
        expiresAt: row.expires_at,
        claimedByPhone: row.claimed_by_phone,
        claimedAt: row.claimed_at,
      }));

      const statsRows = await db.rawQueryAll<any>(`
        SELECT 
          COUNT(*)::int as total_created,
          COUNT(CASE WHEN claimed_by_user_id IS NOT NULL THEN 1 END)::int as total_claimed,
          COUNT(CASE WHEN claimed_by_user_id IS NULL THEN 1 END)::int as total_unclaimed
        FROM vouchers
      `);

      const stats = statsRows[0] || { total_created: 0, total_claimed: 0, total_unclaimed: 0 };

      return { 
        vouchers,
        statistics: {
          totalCreated: stats.total_created,
          totalClaimed: stats.total_claimed,
          totalUnclaimed: stats.total_unclaimed,
        }
      };
    } catch (err) {
      console.error("List vouchers error:", err);
      throw APIError.internal("Failed to list vouchers", err as Error);
    }
  }
);

export interface CreateVoucherBatchRequest {
  amount: number;
  quantity: number;
  expiresAt?: string;
}

export interface CreateVoucherBatchResponse {
  success: boolean;
  codes: string[];
}

function generateVoucherCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 32; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const createVoucherBatch = api<CreateVoucherBatchRequest, CreateVoucherBatchResponse>(
  { expose: true, method: "POST", path: "/admin/vouchers/batch", auth: true },
  async ({ amount, quantity, expiresAt }, ipAddress?: Header<"x-forwarded-for">, userAgent?: Header<"user-agent">) => {
    const auth = getAuthData()!;
    
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Only admin can create vouchers");
    }

    if (![2000, 5000, 10000, 20000, 50000, 100000].includes(amount)) {
      throw APIError.invalidArgument("Amount harus 2000, 5000, 10000, 20000, 50000, atau 100000");
    }

    if (quantity < 1 || quantity > 1000) {
      throw APIError.invalidArgument("Quantity harus antara 1-1000");
    }

    try {
      console.log("=== CREATE VOUCHER BATCH START ===");
      console.log("Amount:", amount);
      console.log("Quantity:", quantity);
      
      const codes: string[] = [];
      const generatedCodes = new Set<string>();

      // Generate unique codes
      while (codes.length < quantity) {
        const code = generateVoucherCode();
        
        if (generatedCodes.has(code)) {
          continue;
        }

        // Check if code already exists in database
        const existing = await db.queryRow<{ code: string }>`
          SELECT code FROM vouchers WHERE code = ${code}
        `;

        if (!existing) {
          codes.push(code);
          generatedCodes.add(code);
        }
      }

      console.log("Generated unique codes:", codes.length);

      // Insert all vouchers
      for (const code of codes) {
        await db.exec`
          INSERT INTO vouchers (code, amount, max_uses, created_by, expires_at)
          VALUES (${code}, ${amount}, 1, ${auth.userID}, ${expiresAt || null})
        `;
      }

      console.log("=== CREATE VOUCHER BATCH SUCCESS ===");
      
      await logAuditAction({
        actionType: "CREATE",
        entityType: "VOUCHER",
        newValues: { amount, quantity, expiresAt, codes },
        metadata: { batchSize: quantity, codesGenerated: codes.length },
      }, ipAddress, userAgent);

      return { success: true, codes };
    } catch (err: any) {
      console.error("=== CREATE VOUCHER BATCH ERROR ===");
      console.error("Error:", err);
      
      if (err instanceof APIError) {
        throw err;
      }
      
      throw APIError.internal("Failed to create voucher batch", err);
    }
  }
);

export interface DeleteVoucherRequest {
  code: string;
}

export interface DeleteVoucherResponse {
  success: boolean;
}

export const deleteVoucher = api<DeleteVoucherRequest, DeleteVoucherResponse>(
  { expose: true, method: "DELETE", path: "/admin/vouchers/:code", auth: true },
  async ({ code }, ipAddress?: Header<"x-forwarded-for">, userAgent?: Header<"user-agent">) => {
    const auth = getAuthData()!;
    
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Only admin can delete vouchers");
    }

    try {
      const voucher = await db.queryRow<{ code: string; amount: number }>` 
        SELECT code, amount FROM vouchers WHERE code = ${code}
      `;
      
      await db.exec`DELETE FROM vouchers WHERE code = ${code}`;
      
      await logAuditAction({
        actionType: "DELETE",
        entityType: "VOUCHER",
        entityId: code,
        oldValues: voucher ? { code: voucher.code, amount: voucher.amount } : { code },
      }, ipAddress, userAgent);
      
      return { success: true };
    } catch (err) {
      console.error("Delete voucher error:", err);
      throw APIError.internal("Failed to delete voucher", err as Error);
    }
  }
);

export interface DeleteAllVouchersResponse {
  success: boolean;
  deletedCount: number;
}

export const deleteAllVouchers = api<void, DeleteAllVouchersResponse>(
  { expose: true, method: "DELETE", path: "/admin/vouchers/all/delete", auth: true },
  async (_, ipAddress?: Header<"x-forwarded-for">, userAgent?: Header<"user-agent">) => {
    const auth = getAuthData()!;
    
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Only admin can delete all vouchers");
    }

    try {
      const countResult = await db.queryRow<{ count: number }>`SELECT COUNT(*)::int as count FROM vouchers`;
      const count = countResult?.count || 0;
      
      await db.exec`DELETE FROM vouchers`;
      
      console.log(`Deleted ${count} vouchers`);
      
      await logAuditAction({
        actionType: "DELETE",
        entityType: "VOUCHER",
        metadata: { action: "deleteAll", deletedCount: count },
      }, ipAddress, userAgent);
      
      return { success: true, deletedCount: count };
    } catch (err) {
      console.error("Delete all vouchers error:", err);
      throw APIError.internal("Failed to delete all vouchers", err as Error);
    }
  }
);
