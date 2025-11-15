import { api } from "encore.dev/api";
import { APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

export interface SecurityAlert {
  id: number;
  alertType: string;
  severity: string;
  title: string;
  description: string;
  phoneNumber: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: any;
  status: string;
  resolvedBy: string | null;
  resolvedAt: string | null;
  resolutionNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListSecurityAlertsRequest {
  status?: string;
  severity?: string;
  alertType?: string;
  limit?: number;
  offset?: number;
}

export interface ListSecurityAlertsResponse {
  alerts: SecurityAlert[];
  total: number;
  stats: {
    newAlerts: number;
    investigating: number;
    resolved: number;
    highSeverity: number;
    criticalSeverity: number;
  };
}

export const listSecurityAlerts = api<ListSecurityAlertsRequest, ListSecurityAlertsResponse>(
  { expose: true, method: "POST", path: "/admin/security-alerts/list", auth: true },
  async ({ status, severity, alertType, limit = 50, offset = 0 }) => {
    const auth = getAuthData();
    if (!auth || !auth.isAdmin) {
      throw APIError.permissionDenied("Admin access required");
    }

    let alertsGen;
    if (!status && !severity && !alertType) {
      alertsGen = db.query<{
        id: number;
        alert_type: string;
        severity: string;
        title: string;
        description: string;
        phone_number: string | null;
        ip_address: string | null;
        user_agent: string | null;
        metadata: string | null;
        status: string;
        resolved_by: string | null;
        resolved_at: Date | null;
        resolution_notes: string | null;
        created_at: Date;
        updated_at: Date;
      }>`
        SELECT 
          id, alert_type, severity, title, description,
          phone_number, ip_address, user_agent, metadata,
          status, resolved_by, resolved_at, resolution_notes,
          created_at, updated_at
        FROM security_alerts
        ORDER BY created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    } else if (status && !severity && !alertType) {
      alertsGen = db.query`
        SELECT 
          id, alert_type, severity, title, description,
          phone_number, ip_address, user_agent, metadata,
          status, resolved_by, resolved_at, resolution_notes,
          created_at, updated_at
        FROM security_alerts
        WHERE status = ${status}
        ORDER BY created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    } else if (!status && severity && !alertType) {
      alertsGen = db.query`
        SELECT 
          id, alert_type, severity, title, description,
          phone_number, ip_address, user_agent, metadata,
          status, resolved_by, resolved_at, resolution_notes,
          created_at, updated_at
        FROM security_alerts
        WHERE severity = ${severity}
        ORDER BY created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    } else if (!status && !severity && alertType) {
      alertsGen = db.query`
        SELECT 
          id, alert_type, severity, title, description,
          phone_number, ip_address, user_agent, metadata,
          status, resolved_by, resolved_at, resolution_notes,
          created_at, updated_at
        FROM security_alerts
        WHERE alert_type = ${alertType}
        ORDER BY created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    } else {
      alertsGen = db.query`
        SELECT 
          id, alert_type, severity, title, description,
          phone_number, ip_address, user_agent, metadata,
          status, resolved_by, resolved_at, resolution_notes,
          created_at, updated_at
        FROM security_alerts
        ORDER BY created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    }

    const alerts: any[] = [];
    for await (const alert of alertsGen) {
      alerts.push(alert);
    }

    const statsResult = await db.queryRow<{
      new_alerts: number;
      investigating: number;
      resolved: number;
      high_severity: number;
      critical_severity: number;
    }>`
      SELECT
        COUNT(*) FILTER (WHERE status = 'new') as new_alerts,
        COUNT(*) FILTER (WHERE status = 'investigating') as investigating,
        COUNT(*) FILTER (WHERE status = 'resolved') as resolved,
        COUNT(*) FILTER (WHERE severity = 'high') as high_severity,
        COUNT(*) FILTER (WHERE severity = 'critical') as critical_severity
      FROM security_alerts
    `;

    return {
      alerts: alerts.map((alert: any) => ({
        id: alert.id,
        alertType: alert.alert_type,
        severity: alert.severity,
        title: alert.title,
        description: alert.description,
        phoneNumber: alert.phone_number,
        ipAddress: alert.ip_address,
        userAgent: alert.user_agent,
        metadata: alert.metadata ? JSON.parse(alert.metadata) : null,
        status: alert.status,
        resolvedBy: alert.resolved_by,
        resolvedAt: alert.resolved_at ? alert.resolved_at.toISOString() : null,
        resolutionNotes: alert.resolution_notes,
        createdAt: alert.created_at.toISOString(),
        updatedAt: alert.updated_at.toISOString(),
      })),
      total: alerts.length,
      stats: {
        newAlerts: statsResult?.new_alerts || 0,
        investigating: statsResult?.investigating || 0,
        resolved: statsResult?.resolved || 0,
        highSeverity: statsResult?.high_severity || 0,
        criticalSeverity: statsResult?.critical_severity || 0,
      },
    };
  }
);

export interface UpdateAlertStatusRequest {
  alertId: number;
  status: "investigating" | "resolved" | "false_positive";
  resolutionNotes?: string;
}

export interface UpdateAlertStatusResponse {
  success: boolean;
}

export const updateAlertStatus = api<UpdateAlertStatusRequest, UpdateAlertStatusResponse>(
  { expose: true, method: "POST", path: "/admin/security-alerts/update-status", auth: true },
  async ({ alertId, status, resolutionNotes }) => {
    const auth = getAuthData();
    if (!auth || !auth.isAdmin) {
      throw APIError.permissionDenied("Admin access required");
    }

    const user = await db.queryRow<{ full_name: string }>`
      SELECT full_name FROM users WHERE clerk_user_id = ${auth.userID}
    `;

    const resolvedBy = user?.full_name || auth.fullName || auth.userID;
    const resolvedAt = status === "resolved" || status === "false_positive" ? new Date() : null;

    await db.exec`
      UPDATE security_alerts
      SET 
        status = ${status},
        resolved_by = ${resolvedBy},
        resolved_at = ${resolvedAt},
        resolution_notes = ${resolutionNotes || null},
        updated_at = NOW()
      WHERE id = ${alertId}
    `;

    return { success: true };
  }
);

export interface DeleteAlertRequest {
  alertId: number;
}

export interface DeleteAlertResponse {
  success: boolean;
}

export const deleteAlert = api<DeleteAlertRequest, DeleteAlertResponse>(
  { expose: true, method: "POST", path: "/admin/security-alerts/delete", auth: true },
  async ({ alertId }) => {
    const auth = getAuthData();
    if (!auth || !auth.isSuperAdmin) {
      throw APIError.permissionDenied("Superadmin access required");
    }

    await db.exec`
      DELETE FROM security_alerts
      WHERE id = ${alertId}
    `;

    return { success: true };
  }
);
