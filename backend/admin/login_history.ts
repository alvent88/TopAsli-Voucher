import { api, Header } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import db from "../db";
import { logAuditAction } from "../audit/logger";

export interface LoginHistoryEntry {
  id: number;
  userId: string;
  name: string | null;
  email: string | null;
  phoneNumber: string | null;
  loginType: string;
  ipAddress: string | null;
  userAgent: string | null;
  loginStatus: string;
  failureReason: string | null;
  createdAt: Date;
}

export interface ListLoginHistoryRequest {
  limit?: number;
  offset?: number;
  ipAddress?: string;
  userId?: string;
  loginStatus?: string;
}

export interface ListLoginHistoryResponse {
  entries: LoginHistoryEntry[];
  total: number;
}

export const listLoginHistory = api(
  { method: "POST", path: "/admin/login-history/list", auth: true, expose: true },
  async (req: ListLoginHistoryRequest): Promise<ListLoginHistoryResponse> => {
    const auth = getAuthData()!;
    
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Only admin can view login history");
    }

    const limit = req.limit || 50;
    const offset = req.offset || 0;

    let whereConditions: string[] = [];
    let queryParams: any[] = [];
    let paramCount = 0;

    if (req.ipAddress) {
      paramCount++;
      whereConditions.push(`ip_address = $${paramCount}`);
      queryParams.push(req.ipAddress);
    }

    if (req.userId) {
      paramCount++;
      whereConditions.push(`user_id = $${paramCount}`);
      queryParams.push(req.userId);
    }

    if (req.loginStatus) {
      paramCount++;
      whereConditions.push(`login_status = $${paramCount}`);
      queryParams.push(req.loginStatus);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(" AND ")}`
      : "";

    const countRows = await db.rawQueryAll<{ total: string }>(
      `SELECT COUNT(*) as total FROM login_history ${whereClause}`,
      ...queryParams
    );
    const total = parseInt(countRows[0]?.total || "0");

    paramCount++;
    queryParams.push(limit);
    paramCount++;
    queryParams.push(offset);

    const rows = await db.rawQueryAll<any>(
      `SELECT 
        lh.id,
        lh.user_id,
        lh.email,
        lh.phone_number,
        lh.login_type,
        lh.ip_address,
        lh.user_agent,
        lh.login_status,
        lh.failure_reason,
        lh.created_at,
        u.name
      FROM login_history lh
      LEFT JOIN users u ON CAST(lh.user_id AS VARCHAR) = u.id
      ${whereClause}
      ORDER BY lh.created_at DESC
      LIMIT $${paramCount - 1} OFFSET $${paramCount}`,
      ...queryParams
    );

    const entries: LoginHistoryEntry[] = rows.map((row: any) => {
      const phoneWithPrefix = row.phone_number ? `62${row.phone_number}` : null;
      return {
        id: row.id,
        userId: row.user_id,
        name: row.name,
        email: null,
        phoneNumber: phoneWithPrefix,
        loginType: row.login_type,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        loginStatus: row.login_status,
        failureReason: row.failure_reason,
        createdAt: row.created_at,
      };
    });

    return { entries, total };
  }
);

export interface GetUsersByIPRequest {
  ipAddress: string;
}

export interface UserIPInfo {
  userId: string;
  name: string | null;
  email: string | null;
  phoneNumber: string | null;
  loginCount: number;
  successCount: number;
  failedCount: number;
  lastLogin: Date;
  firstLogin: Date;
}

export interface GetUsersByIPResponse {
  users: UserIPInfo[];
}

export const getUsersByIP = api(
  { method: "GET", path: "/admin/login-history/ip/:ipAddress", auth: true, expose: true },
  async (req: GetUsersByIPRequest, ipAddress?: Header<"x-forwarded-for">, userAgent?: Header<"user-agent">): Promise<GetUsersByIPResponse> => {
    const auth = getAuthData()!;
    
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Only admin can query users by IP");
    }

    const rows = await db.rawQueryAll<any>(
      `SELECT 
        lh.user_id,
        lh.email,
        lh.phone_number,
        u.name,
        COUNT(*) as login_count,
        SUM(CASE WHEN lh.login_status = 'success' THEN 1 ELSE 0 END) as success_count,
        SUM(CASE WHEN lh.login_status = 'failed' THEN 1 ELSE 0 END) as failed_count,
        MAX(lh.created_at) as last_login,
        MIN(lh.created_at) as first_login
      FROM login_history lh
      LEFT JOIN users u ON CAST(lh.user_id AS VARCHAR) = u.id
      WHERE lh.ip_address = $1
      GROUP BY lh.user_id, lh.email, lh.phone_number, u.name
      ORDER BY last_login DESC`,
      req.ipAddress
    );

    const users: UserIPInfo[] = rows.map((row: any) => {
      const phoneWithPrefix = row.phone_number ? `62${row.phone_number}` : null;
      return {
        userId: row.user_id,
        name: row.name,
        email: null,
        phoneNumber: phoneWithPrefix,
        loginCount: parseInt(row.login_count),
        successCount: parseInt(row.success_count),
        failedCount: parseInt(row.failed_count),
        lastLogin: row.last_login,
        firstLogin: row.first_login,
      };
    });

    await logAuditAction({
      actionType: "EXPORT",
      entityType: "USER",
      metadata: { action: "query_users_by_ip", ipAddress: req.ipAddress, userCount: users.length },
    }, ipAddress, userAgent);

    return { users };
  }
);

export interface ExportLoginHistoryRequest {
  ipAddress?: string;
  userId?: string;
  loginStatus?: string;
  startDate?: string;
  endDate?: string;
}

export interface ExportLoginHistoryResponse {
  xlsx: string;
}

export const exportLoginHistory = api(
  { method: "POST", path: "/admin/login-history/export", auth: true, expose: true },
  async (req: ExportLoginHistoryRequest, ipAddress?: Header<"x-forwarded-for">, userAgent?: Header<"user-agent">): Promise<ExportLoginHistoryResponse> => {
    const auth = getAuthData()!;
    
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Only admin can export login history");
    }

    const XLSX = await import("xlsx");

    let whereConditions: string[] = [];
    let queryParams: any[] = [];
    let paramCount = 0;

    if (req.ipAddress) {
      paramCount++;
      whereConditions.push(`ip_address = $${paramCount}`);
      queryParams.push(req.ipAddress);
    }

    if (req.userId) {
      paramCount++;
      whereConditions.push(`user_id = $${paramCount}`);
      queryParams.push(req.userId);
    }

    if (req.loginStatus) {
      paramCount++;
      whereConditions.push(`login_status = $${paramCount}`);
      queryParams.push(req.loginStatus);
    }

    if (req.startDate) {
      paramCount++;
      whereConditions.push(`created_at >= $${paramCount}`);
      queryParams.push(new Date(req.startDate));
    }

    if (req.endDate) {
      paramCount++;
      whereConditions.push(`created_at <= $${paramCount}`);
      queryParams.push(new Date(req.endDate));
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(" AND ")}`
      : "";

    const rows = await db.rawQueryAll<any>(
      `SELECT 
        lh.id,
        lh.user_id,
        lh.email,
        lh.phone_number,
        lh.login_type,
        lh.ip_address,
        lh.user_agent,
        lh.login_status,
        lh.failure_reason,
        lh.created_at,
        u.name
      FROM login_history lh
      LEFT JOIN users u ON CAST(lh.user_id AS VARCHAR) = u.id
      ${whereClause}
      ORDER BY lh.created_at DESC
      LIMIT 10000`,
      ...queryParams
    );

    const headers = [
      "ID",
      "User ID",
      "Name",
      "Phone Number",
      "Login Type",
      "IP Address",
      "User Agent",
      "Status",
      "Failure Reason",
      "Timestamp",
    ];

    const dataRows = rows.map((row: any) => {
      const phoneWithPrefix = row.phone_number ? `62${row.phone_number}` : "-";
      return [
        row.id.toString(),
        row.user_id || "-",
        row.name || "-",
        phoneWithPrefix,
        row.login_type,
        row.ip_address || "-",
        row.user_agent || "-",
        row.login_status,
        row.failure_reason || "-",
        new Date(row.created_at).toISOString(),
      ];
    });

    const workbook = XLSX.utils.book_new();
    const worksheetData = [headers, ...dataRows];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    const colWidths = [
      { wch: 10 },
      { wch: 30 },
      { wch: 25 },
      { wch: 20 },
      { wch: 15 },
      { wch: 20 },
      { wch: 50 },
      { wch: 10 },
      { wch: 30 },
      { wch: 25 },
    ];
    worksheet['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, "Login History");
    const xlsxBuffer = XLSX.write(workbook, { type: "base64", bookType: "xlsx" });

    await logAuditAction({
      actionType: "EXPORT",
      entityType: "USER",
      metadata: { action: "export_login_history", filters: req, rowCount: rows.length },
    }, ipAddress, userAgent);

    return { xlsx: xlsxBuffer };
  }
);
