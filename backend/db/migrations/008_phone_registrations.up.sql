-- Add table for temporary phone registrations
CREATE TABLE IF NOT EXISTS phone_registrations (
  phone_number TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  birth_place TEXT NOT NULL,
  birth_date TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  clerk_user_id TEXT
);
