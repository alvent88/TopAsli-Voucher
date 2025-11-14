-- Remove email column and email-based constraints
ALTER TABLE users DROP COLUMN IF EXISTS email;

-- Drop email index if exists
DROP INDEX IF EXISTS idx_users_email;

-- Ensure phone_number is properly constrained
ALTER TABLE users 
  ALTER COLUMN phone_number SET NOT NULL;

-- Add constraint if not exists (idempotent)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_phone_number_unique'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_phone_number_unique UNIQUE (phone_number);
  END IF;
END $$;
