-- Add history_id column to processed_email_messages for better deduplication
ALTER TABLE processed_email_messages ADD COLUMN IF NOT EXISTS history_id TEXT;

-- Add index for fast history_id lookups
CREATE INDEX IF NOT EXISTS idx_processed_email_messages_history_id ON processed_email_messages(history_id);
