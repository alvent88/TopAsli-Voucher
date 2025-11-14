-- Remove email column from messages table
ALTER TABLE messages DROP COLUMN IF EXISTS email;
