ALTER TABLE transactions ADD COLUMN clerk_user_id TEXT;
CREATE INDEX idx_transactions_clerk_user_id ON transactions(clerk_user_id);
