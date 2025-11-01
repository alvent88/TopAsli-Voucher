import db from "../db";
import { getAuthData } from "~encore/auth";
import { Header } from "encore.dev/api";

export type ActionType = 
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "ACTIVATE"
  | "DEACTIVATE"
  | "PROMOTE"
  | "BAN"
  | "UNBAN"
  | "EXPORT"
  | "SYNC"
  | "TOGGLE"
  | "UPLOAD";

export type EntityType = 
  | "USER"
  | "VOUCHER"
  | "PRODUCT"
  | "PACKAGE"
  | "CONFIG"
  | "TRANSACTION"
  | "WHATSAPP_CS"
  | "ADMIN";

export interface AuditLogEntry {
  actionType: ActionType;
  entityType: EntityType;
  entityId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface AuditLog {
  id: number;
  adminId: string;
  adminEmail: string | null;
  actionType: string;
  entityType: string;
  entityId: string | null;
  oldValues: Record<string, any> | null;
  newValues: Record<string, any> | null;
  metadata: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export async function logAuditAction(
  entry: AuditLogEntry,
  ipAddress?: Header<"x-forwarded-for">,
  userAgent?: Header<"user-agent">
): Promise<void> {
  try {
    const auth = getAuthData();
    if (!auth) {
      console.error("No auth data available for audit log");
      return;
    }

    const adminEmail = auth.userID;

    await db.query`
      INSERT INTO audit_logs (
        admin_id,
        admin_email,
        action_type,
        entity_type,
        entity_id,
        old_values,
        new_values,
        metadata,
        ip_address,
        user_agent
      ) VALUES (
        ${auth.userID},
        ${adminEmail},
        ${entry.actionType},
        ${entry.entityType},
        ${entry.entityId || null},
        ${entry.oldValues ? JSON.stringify(entry.oldValues) : null},
        ${entry.newValues ? JSON.stringify(entry.newValues) : null},
        ${entry.metadata ? JSON.stringify(entry.metadata) : null},
        ${ipAddress || null},
        ${userAgent || null}
      )
    `;
  } catch (error) {
    console.error("Failed to log audit action:", error);
  }
}

export async function getAuditLogs(params: {
  limit?: number;
  offset?: number;
  adminId?: string;
  actionType?: string;
  entityType?: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<{ logs: AuditLog[]; total: number }> {
  const limit = params.limit || 50;
  const offset = params.offset || 0;

  let whereConditions: string[] = [];
  let queryParams: any[] = [];
  let paramCount = 0;

  if (params.adminId) {
    paramCount++;
    whereConditions.push(`admin_id = $${paramCount}`);
    queryParams.push(params.adminId);
  }

  if (params.actionType) {
    paramCount++;
    whereConditions.push(`action_type = $${paramCount}`);
    queryParams.push(params.actionType);
  }

  if (params.entityType) {
    paramCount++;
    whereConditions.push(`entity_type = $${paramCount}`);
    queryParams.push(params.entityType);
  }

  if (params.startDate) {
    paramCount++;
    whereConditions.push(`created_at >= $${paramCount}`);
    queryParams.push(params.startDate);
  }

  if (params.endDate) {
    paramCount++;
    whereConditions.push(`created_at <= $${paramCount}`);
    queryParams.push(params.endDate);
  }

  const whereClause = whereConditions.length > 0 
    ? `WHERE ${whereConditions.join(" AND ")}`
    : "";

  const countRows = await db.rawQueryAll<{ total: string }>(
    `SELECT COUNT(*) as total FROM audit_logs ${whereClause}`,
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
      admin_id,
      admin_email,
      action_type,
      entity_type,
      entity_id,
      old_values,
      new_values,
      metadata,
      ip_address,
      user_agent,
      created_at
    FROM audit_logs
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${paramCount - 1} OFFSET $${paramCount}`,
    ...queryParams
  );

  const logs: AuditLog[] = rows.map((row: any) => ({
    id: row.id,
    adminId: row.admin_id,
    adminEmail: row.admin_email,
    actionType: row.action_type,
    entityType: row.entity_type,
    entityId: row.entity_id,
    oldValues: row.old_values,
    newValues: row.new_values,
    metadata: row.metadata,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    createdAt: row.created_at,
  }));

  return { logs, total };
}
