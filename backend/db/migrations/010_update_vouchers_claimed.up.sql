ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS claimed_by_user_id TEXT;
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS claimed_by_email TEXT;
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_vouchers_claimed_by ON vouchers(claimed_by_user_id);
