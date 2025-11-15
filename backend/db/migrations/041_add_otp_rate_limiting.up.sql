ALTER TABLE otp_codes ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE otp_codes ADD COLUMN IF NOT EXISTS user_agent TEXT;

CREATE INDEX IF NOT EXISTS idx_otp_phone_created ON otp_codes(phone_number, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_otp_ip_created ON otp_codes(ip_address, created_at DESC);

CREATE TABLE IF NOT EXISTS otp_rate_limit (
  id BIGSERIAL PRIMARY KEY,
  phone_number TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_request_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_otp_rate_limit_phone ON otp_rate_limit(phone_number);
CREATE INDEX IF NOT EXISTS idx_otp_rate_limit_window ON otp_rate_limit(window_start);

CREATE TABLE IF NOT EXISTS otp_ip_rate_limit (
  id BIGSERIAL PRIMARY KEY,
  ip_address TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_request_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_otp_ip_rate_limit_ip ON otp_ip_rate_limit(ip_address);
CREATE INDEX IF NOT EXISTS idx_otp_ip_rate_limit_window ON otp_ip_rate_limit(window_start);
