ALTER TABLE email_registrations ADD COLUMN IF NOT EXISTS last_otp_request_at BIGINT;
ALTER TABLE email_registrations ADD COLUMN IF NOT EXISTS otp_request_count INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_email_registrations_last_otp ON email_registrations(last_otp_request_at);
