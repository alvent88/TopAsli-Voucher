DELETE FROM transactions 
WHERE user_id IN (
  SELECT id FROM users WHERE email IS NULL OR email = ''
);
