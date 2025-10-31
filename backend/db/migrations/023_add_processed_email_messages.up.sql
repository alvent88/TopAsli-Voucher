CREATE TABLE IF NOT EXISTS processed_email_messages (
  message_id TEXT PRIMARY KEY,
  processed_at TIMESTAMP DEFAULT NOW(),
  voucher_code TEXT,
  transaction_id INTEGER,
  user_phone TEXT,
  email_subject TEXT,
  email_snippet TEXT,
  history_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_processed_email_messages_processed_at ON processed_email_messages(processed_at);
CREATE INDEX IF NOT EXISTS idx_processed_email_messages_voucher_code ON processed_email_messages(voucher_code);
CREATE INDEX IF NOT EXISTS idx_processed_email_messages_history_id ON processed_email_messages(history_id);
