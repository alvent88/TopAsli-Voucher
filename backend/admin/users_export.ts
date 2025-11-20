import { api, Header } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import db from "../db";
import { logAuditAction } from "../audit/logger";
import { extractAuditHeaders } from "../audit/extract_headers";

export interface ExportUsersResponse {
  csv: string;
}

export const exportUsers = api<void, ExportUsersResponse>(
  { expose: true, method: "GET", path: "/admin/users/export", auth: true },
  async () => {
    const auth = getAuthData()!;
    
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Only admin can export users");
    }

    try {
      const dbUsers = await db.queryAll<any>`
        SELECT u.clerk_user_id, u.phone_number, u.full_name, u.created_at,
               COALESCE(b.balance, 0) as balance
        FROM users u
        LEFT JOIN user_balance b ON u.clerk_user_id = b.user_id
        ORDER BY u.created_at DESC
        LIMIT 500
      `;
      
      const usersData = dbUsers.map((user: any) => {
        const phoneNumber = user.phone_number || "";
        return {
          userId: user.clerk_user_id,
          phoneNumber: phoneNumber,
          fullName: user.full_name || "",
          balance: user.balance || 0,
          isAdmin: phoneNumber === "62818848168",
          isSuperAdmin: phoneNumber === "62818848168",
          isBanned: false,
          createdAt: user.created_at ? new Date(user.created_at).toISOString() : "",
        };
      });

      const headers = [
        "User ID",
        "Phone Number",
        "Full Name",
        "Balance",
        "Is Admin",
        "Is SuperAdmin",
        "Is Banned",
        "Created At",
      ];

      const csvRows = usersData.map((user) => [
        user.userId,
        user.phoneNumber,
        user.fullName,
        user.balance.toString(),
        user.isAdmin ? "true" : "false",
        user.isSuperAdmin ? "true" : "false",
        user.isBanned ? "true" : "false",
        user.createdAt,
      ]);

      const csvContent = [
        headers.map((h) => `"${h}"`).join(","),
        ...csvRows.map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");

      return { csv: csvContent };
    } catch (err) {
      console.error("Export users error:", err);
      throw APIError.internal("Failed to export users", err as Error);
    }
  }
);

export interface ImportUsersRequest {
  csvData: string;
}

export interface ImportUsersResponse {
  success: boolean;
  updated: number;
  skipped: number;
  errors: string[];
}

export const importUsers = api<ImportUsersRequest, ImportUsersResponse>(
  { expose: true, method: "POST", path: "/admin/users/import", auth: true },
  async (
    { csvData },
    xForwardedFor?: Header<"x-forwarded-for">,
    xRealIp?: Header<"x-real-ip">,
    cfConnectingIp?: Header<"cf-connecting-ip">,
    trueClientIp?: Header<"true-client-ip">,
    userAgent?: Header<"user-agent">
  ) => {
    const auth = getAuthData()!;
    
    if (!auth.isSuperAdmin) {
      throw APIError.permissionDenied("Only superadmin can import users");
    }

    try {
      const lines = csvData.split("\n").filter((line) => line.trim());
      
      if (lines.length < 2) {
        throw APIError.invalidArgument("CSV file is empty or invalid");
      }

      const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim());
      
      const expectedHeaders = [
        "User ID",
        "Phone Number",
        "Full Name",
        "Balance",
        "Is Admin",
        "Is SuperAdmin",
        "Is Banned",
        "Created At",
      ];

      const headerValid = expectedHeaders.every((h) => headers.includes(h));
      if (!headerValid) {
        throw APIError.invalidArgument("CSV headers do not match expected format");
      }

      let updated = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        try {
          const values = lines[i].split(",").map((v) => v.replace(/^"|"$/g, "").replace(/""/g, '"'));
          
          if (values.length < 8) {
            errors.push(`Line ${i + 1}: Invalid number of columns`);
            skipped++;
            continue;
          }

          const [userId, phoneNumber, fullName, balanceStr, isAdminStr, isSuperAdminStr, isBannedStr, createdAt] = values;
          const balance = parseFloat(balanceStr);

          if (isNaN(balance)) {
            errors.push(`Line ${i + 1}: Invalid balance value`);
            skipped++;
            continue;
          }

          try {
            const userRow = await db.queryRow<{ clerk_user_id: string }>`
              SELECT clerk_user_id FROM users WHERE clerk_user_id = ${userId}
            `;
            
            if (!userRow) {
              errors.push(`Line ${i + 1}: User not found (${phoneNumber})`);
              skipped++;
              continue;
            }
            
            const oldBalanceRow = await db.queryRow<{ balance: number }>`
              SELECT balance FROM user_balance WHERE user_id = ${userId}
            `;
            const oldBalance = oldBalanceRow?.balance || 0;

            await db.exec`
              INSERT INTO user_balance (user_id, balance)
              VALUES (${userId}, ${balance})
              ON CONFLICT (user_id) 
              DO UPDATE SET balance = ${balance}
            `;

            if (oldBalance !== balance) {
              await logAuditAction({
                actionType: "UPDATE",
                entityType: "USER",
                entityId: userId,
                oldValues: { balance: oldBalance },
                newValues: { balance },
                metadata: { 
                  method: "CSV Import",
                  phoneNumber: phoneNumber,
                },
              }, extractAuditHeaders(xForwardedFor, xRealIp, cfConnectingIp, trueClientIp, userAgent));
            }

            updated++;
          } catch (err: any) {
            errors.push(`Line ${i + 1}: ${err.message}`);
            skipped++;
          }
        } catch (err: any) {
          errors.push(`Line ${i + 1}: ${err.message}`);
          skipped++;
        }
      }

      return {
        success: true,
        updated,
        skipped,
        errors: errors.slice(0, 10),
      };
    } catch (err: any) {
      console.error("Import users error:", err);
      
      if (err instanceof APIError) {
        throw err;
      }
      
      throw APIError.internal("Failed to import users", err);
    }
  }
);
