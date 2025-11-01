import { api } from "encore.dev/api";
import { getAuditLogs, AuditLog } from "./logger";

export interface ListAuditLogsRequest {
  limit?: number;
  offset?: number;
  adminId?: string;
  actionType?: string;
  entityType?: string;
  startDate?: string;
  endDate?: string;
}

export interface ListAuditLogsResponse {
  logs: AuditLog[];
  total: number;
}

export const list = api(
  { method: "POST", path: "/audit/list", auth: true, expose: true },
  async (req: ListAuditLogsRequest): Promise<ListAuditLogsResponse> => {
    const startDate = req.startDate ? new Date(req.startDate) : undefined;
    const endDate = req.endDate ? new Date(req.endDate) : undefined;

    return await getAuditLogs({
      limit: req.limit,
      offset: req.offset,
      adminId: req.adminId,
      actionType: req.actionType,
      entityType: req.entityType,
      startDate,
      endDate,
    });
  }
);
