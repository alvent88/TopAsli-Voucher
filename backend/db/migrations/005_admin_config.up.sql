CREATE TABLE IF NOT EXISTS admin_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS superadmins (
  email TEXT PRIMARY KEY,
  phone_number TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO superadmins (email, phone_number) 
VALUES ('alvent88@gmail.com', '0818848168')
ON CONFLICT (email) DO UPDATE SET phone_number = EXCLUDED.phone_number;

CREATE INDEX IF NOT EXISTS idx_admin_config_key ON admin_config(key);
