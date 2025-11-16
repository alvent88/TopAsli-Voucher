import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import db from "../db";

export interface ExportVouchersResponse {
  csv: string;
}

export const exportVouchers = api<void, ExportVouchersResponse>(
  { expose: true, method: "GET", path: "/admin/vouchers/export", auth: true },
  async () => {
    const auth = getAuthData()!;
    
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Only admin can export vouchers");
    }

    try {
      const rows = await db.rawQueryAll<any>(`
        SELECT 
          code,
          amount,
          is_active,
          max_uses,
          used_count,
          created_by,
          created_at,
          expires_at,
          claimed_by_phone,
          claimed_by_user_id,
          claimed_at
        FROM vouchers
        ORDER BY created_at DESC
      `);

      const headers = [
        "Code",
        "Amount",
        "Status",
        "Max Uses",
        "Used Count",
        "Created By",
        "Created At",
        "Expires At",
        "Claimed By Phone",
        "Claimed By User ID",
        "Claimed At",
      ];

      const csvRows = rows.map((row) => [
        row.code,
        row.amount.toString(),
        row.is_active ? "Active" : "Inactive",
        row.max_uses.toString(),
        row.used_count.toString(),
        row.created_by,
        new Date(row.created_at).toISOString(),
        row.expires_at ? new Date(row.expires_at).toISOString() : "",
        row.claimed_by_phone || "",
        row.claimed_by_user_id || "",
        row.claimed_at ? new Date(row.claimed_at).toISOString() : "",
      ]);

      const csvContent = [
        headers.map((h) => `"${h}"`).join(","),
        ...csvRows.map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");

      return { csv: csvContent };
    } catch (err) {
      console.error("Export vouchers error:", err);
      throw APIError.internal("Failed to export vouchers", err as Error);
    }
  }
);

export interface ImportVouchersRequest {
  csvData: string;
}

export interface ImportVouchersResponse {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
}

export const importVouchers = api<ImportVouchersRequest, ImportVouchersResponse>(
  { expose: true, method: "POST", path: "/admin/vouchers/import", auth: true },
  async ({ csvData }) => {
    const auth = getAuthData()!;
    
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Only admin can import vouchers");
    }

    try {
      const lines = csvData.split("\n").filter((line) => line.trim());
      
      if (lines.length < 2) {
        throw APIError.invalidArgument("CSV file is empty or invalid");
      }

      const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim());
      
      const expectedHeaders = [
        "Code",
        "Amount",
        "Status",
        "Max Uses",
        "Used Count",
        "Created By",
        "Created At",
        "Expires At",
        "Claimed By Phone",
        "Claimed By User ID",
        "Claimed At",
      ];

      const headerValid = expectedHeaders.every((h) => headers.includes(h));
      if (!headerValid) {
        throw APIError.invalidArgument("CSV headers do not match expected format");
      }

      let imported = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        try {
          const values = lines[i].split(",").map((v) => v.replace(/^"|"$/g, "").replace(/""/g, '"'));
          
          if (values.length < 11) {
            errors.push(`Line ${i + 1}: Invalid number of columns`);
            skipped++;
            continue;
          }

          const [
            code,
            amount,
            status,
            maxUses,
            usedCount,
            createdBy,
            createdAt,
            expiresAt,
            claimedByPhone,
            claimedByUserId,
            claimedAt,
          ] = values;

          const existing = await db.queryRow<{ code: string }>`
            SELECT code FROM vouchers WHERE code = ${code}
          `;

          if (existing) {
            skipped++;
            continue;
          }

          await db.exec`
            INSERT INTO vouchers (
              code,
              amount,
              is_active,
              max_uses,
              used_count,
              created_by,
              created_at,
              expires_at,
              claimed_by_phone,
              claimed_by_user_id,
              claimed_at
            ) VALUES (
              ${code},
              ${parseInt(amount)},
              ${status === "Active"},
              ${parseInt(maxUses)},
              ${parseInt(usedCount)},
              ${createdBy},
              ${createdAt || new Date().toISOString()},
              ${expiresAt || null},
              ${claimedByPhone || null},
              ${claimedByUserId || null},
              ${claimedAt || null}
            )
          `;

          imported++;
        } catch (err: any) {
          errors.push(`Line ${i + 1}: ${err.message}`);
          skipped++;
        }
      }

      return {
        success: true,
        imported,
        skipped,
        errors: errors.slice(0, 10),
      };
    } catch (err: any) {
      console.error("Import vouchers error:", err);
      
      if (err instanceof APIError) {
        throw err;
      }
      
      throw APIError.internal("Failed to import vouchers", err);
    }
  }
);
