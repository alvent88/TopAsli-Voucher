import { api } from "encore.dev/api";
import db from "../db";
import bcrypt from "bcryptjs";

interface InitialSetupRequest {
  adminPhone: string;
  adminPassword: string;
  fullName: string;
  dateOfBirth: string;
  fonnteToken: string;
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
      INSERT INTO users (clerk_user_id, phone_number, full_name, date_of_birth, password_hash, created_at, updated_at)
      VALUES (
        'superadmin_' || ${req.adminPhone},
        ${req.adminPhone},
        ${req.fullName},
        ${req.dateOfBirth},
        ${passwordHash},
        NOW(),
        NOW()
      )
      ON CONFLICT (clerk_user_id) DO UPDATE
      SET password_hash = ${passwordHash},
          full_name = ${req.fullName},
          date_of_birth = ${req.dateOfBirth}
    `;

    const configUpdate: any = {
      whatsapp: {
        fonnteToken: req.fonnteToken,
        phoneNumber: req.adminPhone,
      },
      setupComplete: true,
    };

    const currentConfig = await db.queryRow<{ value: string }>`
      SELECT value FROM admin_config WHERE key = 'dashboard_config'
    `;
    
    let existingConfig = {};
    if (currentConfig?.value) {
      try {
        existingConfig = typeof currentConfig.value === 'string'
          ? JSON.parse(currentConfig.value)
          : currentConfig.value;
      } catch (error) {
        console.error('Error parsing existing config:', error);
      }
    }
    
    const mergedConfig = {
      ...existingConfig,
      ...configUpdate,
    };
    
    await db.exec`
      UPDATE admin_config 
      SET value = ${JSON.stringify(mergedConfig)}::jsonb
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
    const config = await db.queryRow<{ value: string }>`
      SELECT value
      FROM admin_config
      WHERE key = 'dashboard_config'
    `;

    let setupComplete = false;
    if (config?.value) {
      try {
        const parsedValue = typeof config.value === 'string' 
          ? JSON.parse(config.value) 
          : config.value;
        setupComplete = parsedValue?.setupComplete || false;
      } catch (error) {
        console.error('Error parsing config value:', error);
      }
    }
    
    return {
      setupComplete,
      needsSetup: !setupComplete,
    };
  }
);
