import { api, Header } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import { createClerkClient } from "@clerk/backend";
import { secret } from "encore.dev/config";
import db from "../db";
import { logAuditAction } from "../audit/logger";

const clerkSecretKey = secret("ClerkSecretKey");
const clerkClient = createClerkClient({ secretKey: clerkSecretKey() });

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
      const users = await clerkClient.users.getUserList({ limit: 500 });
      
      const usersData = await Promise.all(
        users.data.map(async (user) => {
          const balanceRow = await db.queryRow<{ balance: number }>`
            SELECT balance FROM user_balance WHERE user_id = ${user.id}
          `;
          
          const metadata = user.publicMetadata as any;
          const unsafeMetadata = user.unsafeMetadata as any;
          
          return {
            userId: user.id,
            email: user.emailAddresses[0]?.emailAddress || "",
            phoneNumber: metadata?.phoneNumber || "",
            fullName: unsafeMetadata?.fullName || "",
            balance: balanceRow?.balance || 0,
            isAdmin: metadata?.isAdmin || false,
            isSuperAdmin: metadata?.isSuperAdmin || false,
            isBanned: metadata?.isBanned || false,
            createdAt: new Date(user.createdAt).toISOString(),
          };
        })
      );

      const headers = [
        "User ID",
        "Email",
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
        user.email,
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
  async ({ csvData }, ipAddress?: Header<"x-forwarded-for">, userAgent?: Header<"user-agent">) => {
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
        "Email",
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
          
          if (values.length < 9) {
            errors.push(`Line ${i + 1}: Invalid number of columns`);
            skipped++;
            continue;
          }

          const [userId, email, phoneNumber, fullName, balanceStr, isAdminStr, isSuperAdminStr, isBannedStr, createdAt] = values;
          const balance = parseFloat(balanceStr);

          if (isNaN(balance)) {
            errors.push(`Line ${i + 1}: Invalid balance value`);
            skipped++;
            continue;
          }

          try {
            const user = await clerkClient.users.getUser(userId);
            
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
                  email: user.emailAddresses[0]?.emailAddress,
                },
              }, ipAddress, userAgent);
            }

            updated++;
          } catch (err: any) {
            if (err.status === 404) {
              errors.push(`Line ${i + 1}: User not found (${email})`);
            } else {
              errors.push(`Line ${i + 1}: ${err.message}`);
            }
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
