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
        SELECT id, phone, full_name, date_of_birth, balance 
        FROM users 
        WHERE id = ${userId}
      `;

      if (userResult.length === 0) {
        throw APIError.notFound("User tidak ditemukan");
      }

      const oldUser = userResult[0];

      const updates: string[] = [];
      const setClauses: string[] = [];

      if (fullName !== undefined && fullName !== oldUser.full_name) {
        setClauses.push("full_name");
        updates.push(fullName);
      }

      let formattedPhone = oldUser.phone;
      if (phoneNumber !== undefined) {
        let phone = phoneNumber.replace(/\s/g, "").replace(/-/g, "");
        if (phone.startsWith("0")) {
          phone = phone.substring(1);
        } else if (phone.startsWith("62")) {
          phone = phone.substring(2);
        } else if (phone.startsWith("+62")) {
          phone = phone.substring(3);
        }
        
        if (phone !== oldUser.phone) {
          setClauses.push("phone");
          updates.push(phone);
          formattedPhone = phone;
        }
      }

      if (birthDate !== undefined && birthDate !== oldUser.date_of_birth) {
        setClauses.push("date_of_birth");
        updates.push(birthDate || null);
      }

      if (balance !== undefined && balance !== oldUser.balance) {
        setClauses.push("balance");
        updates.push(balance);
      }

      if (updates.length === 0) {
        return {
          success: true,
          message: "Tidak ada perubahan data",
        };
      }

      if (setClauses.includes("full_name") && setClauses.includes("phone") && setClauses.includes("date_of_birth") && setClauses.includes("balance")) {
        await db.exec`
          UPDATE users 
          SET full_name = ${fullName}, 
              phone = ${formattedPhone}, 
              date_of_birth = ${birthDate || null}, 
              balance = ${balance}
          WHERE id = ${userId}
        `;
      } else if (setClauses.includes("full_name")) {
        await db.exec`UPDATE users SET full_name = ${fullName} WHERE id = ${userId}`;
      } else if (setClauses.includes("phone")) {
        await db.exec`UPDATE users SET phone = ${formattedPhone} WHERE id = ${userId}`;
      } else if (setClauses.includes("date_of_birth")) {
        await db.exec`UPDATE users SET date_of_birth = ${birthDate || null} WHERE id = ${userId}`;
      } else if (setClauses.includes("balance")) {
        await db.exec`UPDATE users SET balance = ${balance} WHERE id = ${userId}`;
      }

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
