import { api } from "encore.dev/api";
import db from "../db";
import bcrypt from "bcryptjs";

export const setDefaultPassword = api(
  { expose: true, method: "POST", path: "/admin/set-default-password", auth: false },
  async () => {
    const defaultPassword = "halo123";
    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    
    const result = await db.exec`
      UPDATE users 
      SET password_hash = ${passwordHash}
      WHERE password_hash IS NULL
    `;
    
    return {
      success: true,
      message: `Updated ${result.rowsAffected} users with default password "halo123"`,
    };
  }
);
