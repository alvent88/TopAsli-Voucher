ALTER TABLE email_registrations ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE email_registrations ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;
ALTER TABLE email_registrations ADD COLUMN IF NOT EXISTS banned_reason TEXT;
ALTER TABLE email_registrations ADD COLUMN IF NOT EXISTS banned_by TEXT;

CREATE TABLE IF NOT EXISTS voucher_claim_attempts (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  attempted_code TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT FALSE,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voucher_attempts_user_time ON voucher_claim_attempts(user_id, attempted_at);

ALTER TABLE voucher_claim_attempts ADD COLUMN IF NOT EXISTS ip_address TEXT;
