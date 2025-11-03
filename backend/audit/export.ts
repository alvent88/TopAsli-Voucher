import { api } from "encore.dev/api";
import { getAuditLogs } from "./logger";
import * as XLSX from "xlsx";

export interface ExportAuditLogsRequest {
  adminId?: string;
  actionType?: string;
  entityType?: string;
  startDate?: string;
  endDate?: string;
}

export interface ExportAuditLogsResponse {
  xlsx: string;
}

export const exportLogs = api(
  { method: "POST", path: "/audit/export", auth: true, expose: true },
  async (req: ExportAuditLogsRequest): Promise<ExportAuditLogsResponse> => {
    const startDate = req.startDate ? new Date(req.startDate) : undefined;
    const endDate = req.endDate ? new Date(req.endDate) : undefined;

    const { logs } = await getAuditLogs({
      limit: 10000,
      offset: 0,
      adminId: req.adminId,
      actionType: req.actionType,
      entityType: req.entityType,
      startDate,
      endDate,
    });

    const headers = [
      "ID",
      "Timestamp",
      "Admin Email",
      "Admin ID",
      "Action Type",
      "Entity Type",
      "Entity ID",
      "Old Values",
      "New Values",
      "Metadata",
      "IP Address",
      "User Agent",
    ];

    const rows = logs.map((log) => [
      log.id.toString(),
      new Date(log.createdAt).toISOString(),
      log.adminEmail || "-",
      log.adminId,
      log.actionType,
      log.entityType,
      log.entityId || "-",
      log.oldValues ? JSON.stringify(log.oldValues) : "-",
      log.newValues ? JSON.stringify(log.newValues) : "-",
      log.metadata ? JSON.stringify(log.metadata) : "-",
      log.ipAddress || "-",
      log.userAgent || "-",
    ]);

    const workbook = XLSX.utils.book_new();
    
    const worksheetData = [
      headers,
      ...rows
    ];
    
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    const colWidths = [
      { wch: 10 },
      { wch: 25 },
      { wch: 30 },
      { wch: 30 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 30 },
      { wch: 30 },
      { wch: 30 },
      { wch: 20 },
      { wch: 50 },
    ];
    worksheet['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(workbook, worksheet, "Audit Logs");
    
    const xlsxBuffer = XLSX.write(workbook, { type: "base64", bookType: "xlsx" });

    return { xlsx: xlsxBuffer };
  }
);
