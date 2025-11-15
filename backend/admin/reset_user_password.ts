import { api } from "encore.dev/api";
import db from "../db";
import bcrypt from "bcryptjs";

export interface ResetUserPasswordRequest {
  phoneNumber: string;
  newPassword: string;
}

export const resetUserPassword = api<ResetUserPasswordRequest, { success: boolean; message: string }>(
  { expose: true, method: "POST", path: "/admin/reset-user-password", auth: false },
  async ({ phoneNumber, newPassword }) => {
    let formattedPhone = phoneNumber.replace(/\s/g, "").replace(/-/g, "");
    
    if (formattedPhone.startsWith("0")) {
      formattedPhone = formattedPhone.substring(1);
    } else if (formattedPhone.startsWith("62")) {
      formattedPhone = formattedPhone.substring(2);
    } else if (formattedPhone.startsWith("+62")) {
      formattedPhone = formattedPhone.substring(3);
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    await db.exec`
      UPDATE users 
      SET password_hash = ${passwordHash}
      WHERE phone_number = ${formattedPhone}
    `;
    
    return {
      success: true,
      message: `Password for ${formattedPhone} has been reset`,
    };
  }
);
