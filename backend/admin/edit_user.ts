import { api, Header } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import db from "../db";
import { logAuditAction } from "../audit/logger";

export interface EditUserRequest {
  userId: string;
  fullName?: string;
  phoneNumber?: string;
  birthDate?: string;
  balance?: number;
}

export interface EditUserResponse {
  success: boolean;
  message: string;
}

export const editUser = api<EditUserRequest, EditUserResponse>(
  { expose: true, method: "POST", path: "/admin/edit-user", auth: true },
  async (req: EditUserRequest, ipAddress?: Header<"x-forwarded-for">, userAgent?: Header<"user-agent">) => {
    const authData = getAuthData();
    
    if (!authData?.isSuperAdmin) {
      throw APIError.permissionDenied("Hanya superadmin yang dapat mengedit user");
    }

    const { userId, fullName, phoneNumber, birthDate, balance } = req;

    try {
      const userResult = await db.query(
        "SELECT id, phone, full_name, date_of_birth, balance FROM users WHERE id = $1",
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw APIError.notFound("User tidak ditemukan");
      }

      const oldUser = userResult.rows[0];
      const oldValues: any = {
        fullName: oldUser.full_name,
        phoneNumber: oldUser.phone,
        birthDate: oldUser.date_of_birth,
        balance: oldUser.balance,
      };

      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (fullName !== undefined && fullName !== oldUser.full_name) {
        updates.push(`full_name = $${paramIndex++}`);
        values.push(fullName);
      }

      if (phoneNumber !== undefined && phoneNumber !== oldUser.phone) {
        let formattedPhone = phoneNumber.replace(/\s/g, "").replace(/-/g, "");
        if (formattedPhone.startsWith("0")) {
          formattedPhone = formattedPhone.substring(1);
        }
        if (formattedPhone.startsWith("62")) {
          formattedPhone = formattedPhone.substring(2);
        }
        if (formattedPhone.startsWith("+62")) {
          formattedPhone = formattedPhone.substring(3);
        }
        
        updates.push(`phone = $${paramIndex++}`);
        values.push(formattedPhone);
      }

      if (birthDate !== undefined && birthDate !== oldUser.date_of_birth) {
        updates.push(`date_of_birth = $${paramIndex++}`);
        values.push(birthDate || null);
      }

      if (balance !== undefined && balance !== oldUser.balance) {
        updates.push(`balance = $${paramIndex++}`);
        values.push(balance);
      }

      if (updates.length === 0) {
        return {
          success: true,
          message: "Tidak ada perubahan data",
        };
      }

      values.push(userId);
      const query = `UPDATE users SET ${updates.join(", ")} WHERE id = $${paramIndex}`;
      
      await db.query(query, values);

      const newValues: any = {};
      if (fullName !== undefined) newValues.fullName = fullName;
      if (phoneNumber !== undefined) newValues.phoneNumber = phoneNumber;
      if (birthDate !== undefined) newValues.birthDate = birthDate;
      if (balance !== undefined) newValues.balance = balance;

      await logAuditAction({
        actionType: "UPDATE",
        entityType: "USER",
        entityId: userId,
        oldValues: oldValues,
        newValues: newValues,
        metadata: { 
          targetUserId: userId,
          updatedBy: authData.userID 
        },
      }, ipAddress, userAgent);

      return {
        success: true,
        message: "Data pengguna berhasil diperbarui",
      };
    } catch (err: any) {
      console.error("Edit user error:", err);
      
      if (err instanceof APIError) {
        throw err;
      }
      
      throw APIError.internal(err.message || "Gagal memperbarui data pengguna");
    }
  }
);
