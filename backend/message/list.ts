import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import db from "../db";
import { logAuditAction } from "../audit/logger";
import { WithAuditMetadata } from "../audit/types";

export interface Message {
  id: number;
  name: string;
  phoneNumber: string | null;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface ListMessagesRequest {
  showRead?: boolean;
  sortBy?: "date" | "name";
  order?: "asc" | "desc";
}

export interface ListMessagesResponse {
  messages: Message[];
  unreadCount: number;
}

export const list = api<ListMessagesRequest, ListMessagesResponse>(
  { expose: true, method: "GET", path: "/admin/messages", auth: true },
  async ({ showRead = true, sortBy = "date", order = "desc" }) => {
    const auth = getAuthData()!;

    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Only admin can access messages");
    }

    let query = `
      SELECT id, name, phone_number, subject, message, is_read, created_at
      FROM messages
    `;

    if (!showRead) {
      query += ` WHERE is_read = FALSE`;
    }

    if (sortBy === "date") {
      query += ` ORDER BY created_at ${order.toUpperCase()}`;
    } else {
      query += ` ORDER BY name ${order.toUpperCase()}`;
    }

    const result = await db.rawQueryAll<any>(query);

    const unreadResult = await db.queryRow<{ count: number }>`SELECT COUNT(*) as count FROM messages WHERE is_read = FALSE`;
    const unreadCount = Number(unreadResult?.count || 0);

    const messages: Message[] = result.map((row) => ({
      id: row.id,
      name: row.name,
      phoneNumber: row.phone_number,
      subject: row.subject,
      message: row.message,
      isRead: row.is_read,
      createdAt: row.created_at,
    }));

    return { messages, unreadCount };
  }
);

export interface MarkAsReadRequest {
  messageId: number;
}

export interface MarkAsReadResponse {
  success: boolean;
}

export const markAsRead = api<MarkAsReadRequest, MarkAsReadResponse>(
  { expose: true, method: "PUT", path: "/admin/messages/:messageId/read", auth: true },
  async ({ messageId }) => {
    const auth = getAuthData()!;

    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Only admin can mark messages as read");
    }

    await db.exec`
      UPDATE messages
      SET is_read = TRUE
      WHERE id = ${messageId}
    `;

    return { success: true };
  }
);

export interface DeleteMessageRequest extends WithAuditMetadata {
  messageId: number;
}

export interface DeleteMessageResponse {
  success: boolean;
}

export const deleteMessage = api<DeleteMessageRequest, DeleteMessageResponse>(
  { expose: true, method: "POST", path: "/admin/messages/:messageId/delete", auth: true },
  async ({ messageId, _auditMetadata }) => {
    const auth = getAuthData()!;

    if (!auth.isSuperAdmin) {
      throw APIError.permissionDenied("Only superadmin can delete messages");
    }

    const message = await db.queryRow<{ name: string; subject: string; phone_number: string | null }>`
      SELECT name, subject, phone_number FROM messages WHERE id = ${messageId}
    `;

    await db.exec`
      DELETE FROM messages
      WHERE id = ${messageId}
    `;

    await logAuditAction({
      actionType: "DELETE",
      entityType: "MESSAGE",
      entityId: messageId.toString(),
      oldValues: message ? { name: message.name, subject: message.subject, phoneNumber: message.phone_number } : undefined,
    }, _auditMetadata);

    return { success: true };
  }
);
