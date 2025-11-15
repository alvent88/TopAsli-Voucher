import { api } from "encore.dev/api";
import db from "../db";
import bcrypt from "bcryptjs";

interface InitialSetupRequest {
  adminPhone: string;
  adminPassword: string;
  fonnteToken: string;
  uniplayApiKey?: string;
  uniplayPincode?: string;
}

interface InitialSetupResponse {
  success: boolean;
  message: string;
  adminPhone: string;
}

interface SetupStatusResponse {
  setupComplete: boolean;
  needsSetup: boolean;
}

export const initialSetup = api(
  { expose: true, method: "POST", path: "/admin/initial-setup", auth: false },
  async (req: InitialSetupRequest): Promise<InitialSetupResponse> => {
    const setupKey = await db.queryRow<{ value: string }>`
      SELECT (value::jsonb)->>'setupComplete' as value
      FROM admin_config
      WHERE key = 'dashboard_config'
    `;

    if (setupKey && setupKey.value === 'true') {
      throw new Error("Setup sudah pernah dilakukan. Gunakan panel admin untuk mengubah konfigurasi.");
    }

    const passwordHash = await bcrypt.hash(req.adminPassword, 10);
    
    await db.exec`
      INSERT INTO users (clerk_user_id, phone_number, full_name, password_hash, created_at, updated_at)
      VALUES (
        'superadmin_' || ${req.adminPhone},
        ${req.adminPhone},
        'Super Admin',
        ${passwordHash},
        NOW(),
        NOW()
      )
      ON CONFLICT (clerk_user_id) DO UPDATE
      SET password_hash = ${passwordHash}
    `;

    const configUpdate: any = {
      whatsapp: {
        fonnteToken: req.fonnteToken,
        phoneNumber: req.adminPhone,
      },
      setupComplete: true,
    };

    if (req.uniplayApiKey) {
      configUpdate.uniplay = {
        apiKey: req.uniplayApiKey,
        pincode: req.uniplayPincode || "",
        baseUrl: "https://api-reseller.uniplay.id/v1",
      };
    }

    await db.exec`
      UPDATE admin_config 
      SET value = value::jsonb || ${JSON.stringify(configUpdate)}::jsonb
      WHERE key = 'dashboard_config'
    `;
    
    return {
      success: true,
      message: "Setup berhasil! Silakan login dengan nomor telepon dan password yang telah dibuat.",
      adminPhone: req.adminPhone,
    };
  }
);

export const checkSetupStatus = api(
  { expose: true, method: "GET", path: "/admin/setup-status", auth: false },
  async (): Promise<SetupStatusResponse> => {
    const config = await db.queryRow<{ value: any }>`
      SELECT value
      FROM admin_config
      WHERE key = 'dashboard_config'
    `;

    const setupComplete = config?.value?.setupComplete || false;
    
    return {
      setupComplete,
      needsSetup: !setupComplete,
    };
  }
);
