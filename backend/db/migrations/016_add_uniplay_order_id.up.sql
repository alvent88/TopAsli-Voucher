ALTER TABLE transactions ADD COLUMN IF NOT EXISTS uniplay_order_id TEXT;
CREATE INDEX IF NOT EXISTS idx_transactions_uniplay_order_id ON transactions(uniplay_order_id);
