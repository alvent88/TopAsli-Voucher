import db from "../db";
import { getAuthData } from "~encore/auth";
import { Header } from "encore.dev/api";
import { createClerkClient } from "@clerk/backend";
import { secret } from "encore.dev/config";

const clerkSecretKey = secret("ClerkSecretKey");
const clerkClient = createClerkClient({ secretKey: clerkSecretKey() });

export type ActionType = 
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "ACTIVATE"
  | "DEACTIVATE"
  | "PROMOTE"
  | "DEMOTE"
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
  | "ADMIN"
  | "MESSAGE";

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
  adminName: string | null;
  adminEmail: string | null;
  actionType: string;
  entityType: string;
  entityId: string | null;
  entityName: string | null;
  oldValues: Record<string, any> | null;
  newValues: Record<string, any> | null;
  metadata: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export interface AuditMetadata {
  ipAddress?: string;
  userAgent?: string;
}

export async function logAuditAction(
  entry: AuditLogEntry,
  metadata?: AuditMetadata
): Promise<void> {
  try {
    const auth = getAuthData();
    if (!auth) {
      console.error("No auth data available for audit log");
      return;
    }

    let adminEmail = auth.userID;
    
    try {
      const user = await clerkClient.users.getUser(auth.userID);
      adminEmail = user.emailAddresses[0]?.emailAddress || auth.userID;
    } catch (error) {
      console.error("Failed to fetch user email from Clerk:", error);
    }

    const finalIpAddress = metadata?.ipAddress || "unknown";
    const finalUserAgent = metadata?.userAgent || "unknown";

    await db.exec`
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
        ${finalIpAddress},
        ${finalUserAgent}
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
      al.id,
      al.admin_id,
      al.admin_email,
      u.full_name as admin_name,
      al.action_type,
      al.entity_type,
      al.entity_id,
      CASE 
        WHEN al.entity_type = 'USER' THEN (SELECT full_name FROM users WHERE clerk_user_id = al.entity_id)
        WHEN al.entity_type = 'ADMIN' THEN (SELECT full_name FROM users WHERE clerk_user_id = al.entity_id)
        WHEN al.entity_type = 'PRODUCT' THEN (SELECT name FROM products WHERE id::text = al.entity_id)
        WHEN al.entity_type = 'PACKAGE' THEN (
          SELECT p.name || ' (' || pkg.name || ')' 
          FROM packages pkg 
          LEFT JOIN products p ON pkg.product_id = p.id 
          WHERE pkg.id::text = al.entity_id
        )
        WHEN al.entity_type = 'VOUCHER' THEN al.entity_id
        WHEN al.entity_type = 'WHATSAPP_CS' THEN (SELECT admin_name FROM whatsapp_cs_numbers WHERE id::text = al.entity_id)
        WHEN al.entity_type = 'MESSAGE' THEN (SELECT name || ' - ' || subject FROM messages WHERE id::text = al.entity_id)
        ELSE al.entity_id
      END as entity_name,
      al.old_values,
      al.new_values,
      al.metadata,
      al.ip_address,
      al.user_agent,
      al.created_at
    FROM audit_logs al
    LEFT JOIN users u ON al.admin_id = u.clerk_user_id
    ${whereClause}
    ORDER BY al.created_at DESC
    LIMIT $${paramCount - 1} OFFSET $${paramCount}`,
    ...queryParams
  );

  const logs: AuditLog[] = rows.map((row: any) => ({
    id: row.id,
    adminId: row.admin_id,
    adminName: row.admin_name,
    adminEmail: row.admin_email,
    actionType: row.action_type,
    entityType: row.entity_type,
    entityId: row.entity_id,
    entityName: row.entity_name,
    oldValues: row.old_values,
    newValues: row.new_values,
    metadata: row.metadata,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    createdAt: row.created_at,
  }));

  return { logs, total };
}
