CREATE TABLE email_registrations (
  email TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  clerk_user_id TEXT UNIQUE,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE INDEX idx_email_registrations_clerk_user_id ON email_registrations(clerk_user_id);
