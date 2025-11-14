ALTER TABLE users 
  ALTER COLUMN phone_number SET NOT NULL,
  ADD CONSTRAINT users_phone_number_unique UNIQUE (phone_number);

CREATE INDEX IF NOT EXISTS idx_users_phone_unique ON users(phone_number);
