import { api, Header } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import db from "../db";
import { logAuditAction } from "../audit/logger";

export interface AdminConfig {
  whatsapp: {
    fonnteToken: string;
    phoneNumber: string;
    webhookUrl: string;
  };
  topup: {
    provider: string;
    apiKey: string;
    merchantId: string;
    secretKey: string;
  };
  uniplay: {
    apiKey: string;
    baseUrl: string;
    pincode: string;
  };
  gmail: {
    uniplaySenderEmail: string;
  };
}

export interface SaveConfigRequest {
  config: AdminConfig;
}

export interface SaveConfigResponse {
  success: boolean;
}

export interface SaveGlobalDiscountRequest {
  discount: number;
}

export interface SaveGlobalDiscountResponse {
  success: boolean;
}

export interface GetGlobalDiscountResponse {
  discount: number;
}

export const saveConfig = api<SaveConfigRequest, SaveConfigResponse>(
  { expose: true, method: "POST", path: "/admin/config/save", auth: true },
  async ({ config }, ipAddress?: Header<"x-forwarded-for">, userAgent?: Header<"user-agent">) => {
    const auth = getAuthData()!;
    
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Only admin can save config");
    }

    try {
      const configJson = JSON.stringify(config);
      
      const oldConfigRow = await db.queryRow<{ value: string }>` 
        SELECT value FROM admin_config WHERE key = 'dashboard_config'
      `;
      
      await db.exec`
        INSERT INTO admin_config (key, value, updated_at)
        VALUES ('dashboard_config', ${configJson}, NOW())
        ON CONFLICT (key) 
        DO UPDATE SET value = ${configJson}, updated_at = NOW()
      `;
      
      await logAuditAction({
        actionType: "UPDATE",
        entityType: "CONFIG",
        entityId: "dashboard_config",
        oldValues: oldConfigRow ? JSON.parse(oldConfigRow.value) : undefined,
        newValues: config,
      }, ipAddress, userAgent);

      return { success: true };
    } catch (err) {
      console.error("Failed to save config:", err);
      throw APIError.internal("Failed to save configuration", err as Error);
    }
  }
);

export interface GetConfigResponse {
  config: AdminConfig;
}

export const getConfig = api<void, GetConfigResponse>(
  { expose: true, method: "GET", path: "/admin/config/get", auth: true },
  async () => {
    const auth = getAuthData()!;
    
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Only admin can get config");
    }

    try {
      const row = await db.queryRow<{ value: string }>`
        SELECT value FROM admin_config WHERE key = 'dashboard_config'
      `;

      if (!row) {
        return {
          config: {
            whatsapp: {
              fonnteToken: "",
              phoneNumber: "",
              webhookUrl: "",
            },
            topup: {
              provider: "unipin",
              apiKey: "",
              merchantId: "",
              secretKey: "",
            },
            uniplay: {
              apiKey: "",
              baseUrl: "https://api-reseller.uniplay.id/v1",
              pincode: "",
            },
            gmail: {
              uniplaySenderEmail: "",
            },
          },
        };
      }

      const config = JSON.parse(row.value) as AdminConfig;
      return { config };
    } catch (err) {
      console.error("Failed to get config:", err);
      throw APIError.internal("Failed to get configuration", err as Error);
    }
  }
);

export interface GetSuperadminPhoneRequest {
  email: string;
}

export interface GetSuperadminPhoneResponse {
  phoneNumber: string;
}

export const getSuperadminPhone = api<GetSuperadminPhoneRequest, GetSuperadminPhoneResponse>(
  { expose: true, method: "GET", path: "/admin/superadmin/phone/:email", auth: true },
  async ({ email }) => {
    const auth = getAuthData()!;
    
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Only admin can get superadmin info");
    }

    try {
      const row = await db.queryRow<{ phone_number: string }>`
        SELECT phone_number FROM superadmins WHERE email = ${email}
      `;

      if (!row) {
        throw APIError.notFound("Superadmin not found");
      }

      return { phoneNumber: row.phone_number };
    } catch (err) {
      console.error("Failed to get superadmin phone:", err);
      throw APIError.internal("Failed to get superadmin phone", err as Error);
    }
  }
);

export const saveGlobalDiscount = api<SaveGlobalDiscountRequest, SaveGlobalDiscountResponse>(
  { expose: true, method: "POST", path: "/admin/config/global-discount", auth: true },
  async ({ discount }, ipAddress?: Header<"x-forwarded-for">, userAgent?: Header<"user-agent">) => {
    const auth = getAuthData()!;
    
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Only admin can save global discount");
    }

    try {
      const oldDiscountRow = await db.queryRow<{ value: string }>` 
        SELECT value FROM admin_config WHERE key = 'global_discount'
      `;
      
      await db.exec`
        INSERT INTO admin_config (key, value, updated_at)
        VALUES ('global_discount', ${discount.toString()}, NOW())
        ON CONFLICT (key) 
        DO UPDATE SET value = ${discount.toString()}, updated_at = NOW()
      `;
      
      await logAuditAction({
        actionType: "UPDATE",
        entityType: "CONFIG",
        entityId: "global_discount",
        oldValues: oldDiscountRow ? { discount: parseFloat(oldDiscountRow.value) } : undefined,
        newValues: { discount },
      }, ipAddress, userAgent);

      return { success: true };
    } catch (err) {
      console.error("Failed to save global discount:", err);
      throw APIError.internal("Failed to save global discount", err as Error);
    }
  }
);

export const getGlobalDiscount = api<void, GetGlobalDiscountResponse>(
  { expose: true, method: "GET", path: "/admin/config/global-discount", auth: true },
  async () => {
    const auth = getAuthData()!;
    
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Only admin can get global discount");
    }

    try {
      const row = await db.queryRow<{ value: string }>`
        SELECT value FROM admin_config WHERE key = 'global_discount'
      `;

      if (!row) {
        return { discount: 0 };
      }

      return { discount: parseFloat(row.value) };
    } catch (err) {
      console.error("Failed to get global discount:", err);
      throw APIError.internal("Failed to get global discount", err as Error);
    }
  }
);
