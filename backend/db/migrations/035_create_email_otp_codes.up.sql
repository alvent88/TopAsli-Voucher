CREATE TABLE IF NOT EXISTS email_otp_codes (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  created_at BIGINT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  expires_at BIGINT NOT NULL
);

CREATE INDEX idx_email_otp_codes_email ON email_otp_codes(email);
CREATE INDEX idx_email_otp_codes_created_at ON email_otp_codes(created_at);
