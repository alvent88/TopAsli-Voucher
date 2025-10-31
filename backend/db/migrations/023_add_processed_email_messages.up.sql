CREATE TABLE IF NOT EXISTS processed_email_messages (
  message_id TEXT PRIMARY KEY,
  processed_at TIMESTAMP DEFAULT NOW(),
  voucher_code TEXT,
  transaction_id INTEGER,
  user_phone TEXT
);

CREATE INDEX IF NOT EXISTS idx_processed_email_messages_processed_at ON processed_email_messages(processed_at);
