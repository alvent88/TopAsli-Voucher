-- Add birth_date column to email_registrations table
ALTER TABLE email_registrations ADD COLUMN birth_date TEXT DEFAULT '';
