-- Add indexes for frequently queried columns to improve performance

-- phone_registrations: phone_number is already PRIMARY KEY (indexed)
-- Add index on clerk_user_id for lookups
CREATE INDEX IF NOT EXISTS idx_phone_registrations_clerk_user_id ON phone_registrations(clerk_user_id);

-- Add index on is_banned for filtering banned users
CREATE INDEX IF NOT EXISTS idx_phone_registrations_is_banned ON phone_registrations(is_banned) WHERE is_banned = true;

-- email_registrations: email is already PRIMARY KEY (indexed)
-- clerk_user_id index already exists from migration 009
-- Add index on is_banned for filtering banned users
CREATE INDEX IF NOT EXISTS idx_email_registrations_is_banned ON email_registrations(is_banned) WHERE is_banned = true;

-- transactions: add composite index for user transaction queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_clerk_user_status ON transactions(clerk_user_id, status);
CREATE INDEX IF NOT EXISTS idx_transactions_user_created ON transactions(user_id, created_at DESC);

-- superadmins: phone_number lookups
CREATE INDEX IF NOT EXISTS idx_superadmins_phone ON superadmins(phone_number);

-- voucher_claim_attempts: composite index already exists for user_id + attempted_at
-- Add index for IP-based lookups
CREATE INDEX IF NOT EXISTS idx_voucher_attempts_ip_time ON voucher_claim_attempts(ip_address, attempted_at) WHERE ip_address IS NOT NULL;

-- balance_history: add index on voucher_code for voucher usage tracking
CREATE INDEX IF NOT EXISTS idx_balance_history_voucher ON balance_history(voucher_code) WHERE voucher_code IS NOT NULL;

-- messages: add index on email for filtering by sender
CREATE INDEX IF NOT EXISTS idx_messages_email ON messages(email);

-- Add composite index for unread messages ordering
CREATE INDEX IF NOT EXISTS idx_messages_unread_created ON messages(is_read, created_at DESC) WHERE is_read = false;
