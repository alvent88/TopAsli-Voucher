DELETE FROM transactions 
WHERE user_id NOT IN (
  SELECT clerk_user_id FROM email_registrations WHERE clerk_user_id IS NOT NULL
);
