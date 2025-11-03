import { api, Header } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import db from "../db";
import { logAuditAction } from "../audit/logger";

export interface LoginHistoryEntry {
  id: number;
  userId: string;
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
        id,
        user_id,
        email,
        phone_number,
        login_type,
        ip_address,
        user_agent,
        login_status,
        failure_reason,
        created_at
      FROM login_history
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramCount - 1} OFFSET $${paramCount}`,
      ...queryParams
    );

    const entries: LoginHistoryEntry[] = rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      email: row.email,
      phoneNumber: row.phone_number,
      loginType: row.login_type,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      loginStatus: row.login_status,
      failureReason: row.failure_reason,
      createdAt: row.created_at,
    }));

    return { entries, total };
  }
);

export interface GetUsersByIPRequest {
  ipAddress: string;
}

export interface UserIPInfo {
  userId: string;
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
        user_id,
        email,
        phone_number,
        COUNT(*) as login_count,
        SUM(CASE WHEN login_status = 'success' THEN 1 ELSE 0 END) as success_count,
        SUM(CASE WHEN login_status = 'failed' THEN 1 ELSE 0 END) as failed_count,
        MAX(created_at) as last_login,
        MIN(created_at) as first_login
      FROM login_history
      WHERE ip_address = $1
      GROUP BY user_id, email, phone_number
      ORDER BY last_login DESC`,
      req.ipAddress
    );

    const users: UserIPInfo[] = rows.map((row: any) => ({
      userId: row.user_id,
      email: row.email,
      phoneNumber: row.phone_number,
      loginCount: parseInt(row.login_count),
      successCount: parseInt(row.success_count),
      failedCount: parseInt(row.failed_count),
      lastLogin: row.last_login,
      firstLogin: row.first_login,
    }));

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
        id,
        user_id,
        email,
        phone_number,
        login_type,
        ip_address,
        user_agent,
        login_status,
        failure_reason,
        created_at
      FROM login_history
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT 10000`,
      ...queryParams
    );

    const headers = [
      "ID",
      "User ID",
      "Email",
      "Phone Number",
      "Login Type",
      "IP Address",
      "User Agent",
      "Status",
      "Failure Reason",
      "Timestamp",
    ];

    const dataRows = rows.map((row: any) => [
      row.id.toString(),
      row.user_id || "-",
      row.email || "-",
      row.phone_number || "-",
      row.login_type,
      row.ip_address || "-",
      row.user_agent || "-",
      row.login_status,
      row.failure_reason || "-",
      new Date(row.created_at).toISOString(),
    ]);

    const workbook = XLSX.utils.book_new();
    const worksheetData = [headers, ...dataRows];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    const colWidths = [
      { wch: 10 },
      { wch: 30 },
      { wch: 30 },
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
