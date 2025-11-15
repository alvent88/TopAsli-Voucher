import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import db from "../db";

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
  async (req: EditUserRequest) => {
    const authData = getAuthData();
    
    if (!authData?.isSuperAdmin) {
      throw APIError.permissionDenied("Hanya superadmin yang dapat mengedit user");
    }

    const { userId, fullName, phoneNumber, birthDate, balance } = req;

    try {
      const userResult = await db.queryAll<any>`
        SELECT clerk_user_id, phone_number, full_name, birth_date, balance 
        FROM users 
        WHERE clerk_user_id = ${userId}
      `;

      if (userResult.length === 0) {
        throw APIError.notFound("User tidak ditemukan");
      }

      const oldUser = userResult[0];

      let updateQuery = "UPDATE users SET ";
      const updates: string[] = [];
      
      if (fullName !== undefined && fullName !== oldUser.full_name) {
        updates.push(`full_name = '${fullName.replace(/'/g, "''")}'`);
      }

      if (phoneNumber !== undefined) {
        let phone = phoneNumber.replace(/\s/g, "").replace(/-/g, "");
        if (phone.startsWith("0")) {
          phone = phone.substring(1);
        } else if (phone.startsWith("62")) {
          phone = phone.substring(2);
        } else if (phone.startsWith("+62")) {
          phone = phone.substring(3);
        }
        
        if (phone !== oldUser.phone_number) {
          updates.push(`phone_number = '${phone}'`);
        }
      }

      if (birthDate !== undefined && birthDate !== oldUser.birth_date) {
        if (birthDate) {
          updates.push(`birth_date = '${birthDate}'`);
        } else {
          updates.push(`birth_date = NULL`);
        }
      }

      if (balance !== undefined && balance !== oldUser.balance) {
        updates.push(`balance = ${balance}`);
      }

      if (updates.length === 0) {
        return {
          success: true,
          message: "Tidak ada perubahan data",
        };
      }

      updateQuery += updates.join(", ");
      updateQuery += ` WHERE clerk_user_id = '${userId}'`;

      await db.exec(updateQuery as any);

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
