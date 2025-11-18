-- Drop the old birth_date column that has default value '2000-01-01'
-- We are using date_of_birth column instead
ALTER TABLE users DROP COLUMN IF EXISTS birth_date;
