import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import db from "../db";
import { logAuditAction } from "../audit/logger";
import { WithAuditMetadata } from "../audit/types";

export interface WhatsAppCSNumber {
  id: number;
  phoneNumber: string;
  adminName: string;
  isActive: boolean;
  addedBy: string;
  addedAt: string;
  updatedAt: string;
}

export interface ListWhatsAppCSResponse {
  numbers: WhatsAppCSNumber[];
}

export const listWhatsAppCS = api<void, ListWhatsAppCSResponse>(
  { expose: true, method: "GET", path: "/admin/whatsapp-cs", auth: true },
  async () => {
    const auth = getAuthData()!;
    
    if (!auth.isSuperAdmin) {
      throw APIError.permissionDenied("Only superadmin can access WhatsApp CS numbers");
    }

    try {
      const rows = await db.rawQueryAll<any>(
        `SELECT id, phone_number, admin_name, is_active, added_by, added_at, updated_at
         FROM whatsapp_cs_numbers
         ORDER BY is_active DESC, added_at DESC`
      );

      const numbers: WhatsAppCSNumber[] = rows.map(row => ({
        id: row.id,
        phoneNumber: row.phone_number,
        adminName: row.admin_name,
        isActive: row.is_active,
        addedBy: row.added_by,
        addedAt: new Date(row.added_at).toISOString(),
        updatedAt: new Date(row.updated_at).toISOString(),
      }));

      return { numbers };
    } catch (err) {
      console.error("List WhatsApp CS error:", err);
      throw APIError.internal("Failed to list WhatsApp CS numbers", err as Error);
    }
  }
);

export interface AddWhatsAppCSRequest extends WithAuditMetadata {
  phoneNumber: string;
  adminName: string;
}

export interface AddWhatsAppCSResponse {
  success: boolean;
  id: number;
}

export const addWhatsAppCS = api<AddWhatsAppCSRequest, AddWhatsAppCSResponse>(
  { expose: true, method: "POST", path: "/admin/whatsapp-cs", auth: true },
  async ({ phoneNumber, adminName, _auditMetadata }) => {
    const auth = getAuthData()!;
    
    if (!auth.isSuperAdmin) {
      throw APIError.permissionDenied("Only superadmin can add WhatsApp CS numbers");
    }

    try {
      let formattedPhone = phoneNumber.replace(/\s/g, "").replace(/-/g, "");
      if (formattedPhone.startsWith("0")) {
        formattedPhone = "62" + formattedPhone.substring(1);
      } else if (!formattedPhone.startsWith("62")) {
        formattedPhone = "62" + formattedPhone;
      }

      const result = await db.queryRow<{ id: number }>`
        INSERT INTO whatsapp_cs_numbers (phone_number, admin_name, is_active, added_by)
        VALUES (${formattedPhone}, ${adminName}, true, ${auth.userID})
        RETURNING id
      `;
      
      await logAuditAction({
        actionType: "CREATE",
        entityType: "WHATSAPP_CS",
        entityId: result!.id.toString(),
        newValues: { phoneNumber: formattedPhone, adminName, isActive: true },
      }, _auditMetadata);

      return { success: true, id: result!.id };
    } catch (err: any) {
      console.error("Add WhatsApp CS error:", err);
      
      if (err.message?.includes("duplicate key") || err.message?.includes("unique")) {
        throw APIError.alreadyExists("Nomor WhatsApp sudah terdaftar");
      }
      
      throw APIError.internal("Failed to add WhatsApp CS number", err as Error);
    }
  }
);

export interface UpdateWhatsAppCSRequest extends WithAuditMetadata {
  id: number;
  phoneNumber?: string;
  adminName?: string;
  isActive?: boolean;
}

export interface UpdateWhatsAppCSResponse {
  success: boolean;
}

export const updateWhatsAppCS = api<UpdateWhatsAppCSRequest, UpdateWhatsAppCSResponse>(
  { expose: true, method: "PUT", path: "/admin/whatsapp-cs/:id", auth: true },
  async ({ id, phoneNumber, adminName, isActive, _auditMetadata }) => {
    const auth = getAuthData()!;
    
    if (!auth.isSuperAdmin) {
      throw APIError.permissionDenied("Only superadmin can update WhatsApp CS numbers");
    }

    try {
      const oldCS = await db.queryRow<{ phone_number: string; admin_name: string; is_active: boolean }>` 
        SELECT phone_number, admin_name, is_active FROM whatsapp_cs_numbers WHERE id = ${id}
      `;
      
      const updates: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (phoneNumber !== undefined) {
        let formattedPhone = phoneNumber.replace(/\s/g, "").replace(/-/g, "");
        if (formattedPhone.startsWith("0")) {
          formattedPhone = "62" + formattedPhone.substring(1);
        } else if (!formattedPhone.startsWith("62")) {
          formattedPhone = "62" + formattedPhone;
        }
        updates.push(`phone_number = $${paramIndex++}`);
        params.push(formattedPhone);
      }

      if (adminName !== undefined) {
        updates.push(`admin_name = $${paramIndex++}`);
        params.push(adminName);
      }

      if (isActive !== undefined) {
        updates.push(`is_active = $${paramIndex++}`);
        params.push(isActive);
      }

      updates.push(`updated_at = NOW()`);

      params.push(id);
      const query = `UPDATE whatsapp_cs_numbers SET ${updates.join(", ")} WHERE id = $${paramIndex}`;

      await db.rawQueryAll(query, ...params);
      
      await logAuditAction({
        actionType: "UPDATE",
        entityType: "WHATSAPP_CS",
        entityId: id.toString(),
        oldValues: oldCS ? {
          phoneNumber: oldCS.phone_number,
          adminName: oldCS.admin_name,
          isActive: oldCS.is_active,
        } : undefined,
        newValues: { phoneNumber, adminName, isActive },
      }, _auditMetadata);

      return { success: true };
    } catch (err) {
      console.error("Update WhatsApp CS error:", err);
      throw APIError.internal("Failed to update WhatsApp CS number", err as Error);
    }
  }
);

export interface DeleteWhatsAppCSRequest extends WithAuditMetadata {
  id: number;
}

export interface DeleteWhatsAppCSResponse {
  success: boolean;
}

export const deleteWhatsAppCS = api<DeleteWhatsAppCSRequest, DeleteWhatsAppCSResponse>(
  { expose: true, method: "POST", path: "/admin/whatsapp-cs/:id/delete", auth: true },
  async ({ id, _auditMetadata }) => {
    const auth = getAuthData()!;
    
    if (!auth.isSuperAdmin) {
      throw APIError.permissionDenied("Only superadmin can delete WhatsApp CS numbers");
    }

    try {
      const cs = await db.queryRow<{ phone_number: string; admin_name: string }>` 
        SELECT phone_number, admin_name FROM whatsapp_cs_numbers WHERE id = ${id}
      `;
      
      await db.rawQueryAll(`DELETE FROM whatsapp_cs_numbers WHERE id = $1`, id);
      
      await logAuditAction({
        actionType: "DELETE",
        entityType: "WHATSAPP_CS",
        entityId: id.toString(),
        oldValues: cs ? { phoneNumber: cs.phone_number, adminName: cs.admin_name } : undefined,
      }, _auditMetadata);
      
      return { success: true };
    } catch (err) {
      console.error("Delete WhatsApp CS error:", err);
      throw APIError.internal("Failed to delete WhatsApp CS number", err as Error);
    }
  }
);
