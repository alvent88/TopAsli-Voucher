CREATE TABLE IF NOT EXISTS whatsapp_cs_numbers (
  id BIGSERIAL PRIMARY KEY,
  phone_number TEXT NOT NULL UNIQUE,
  admin_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  added_by TEXT NOT NULL,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_cs_active ON whatsapp_cs_numbers(is_active);
