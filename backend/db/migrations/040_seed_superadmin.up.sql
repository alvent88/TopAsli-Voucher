-- Mark setup as incomplete
UPDATE admin_config 
SET value = jsonb_set(
  value::jsonb,
  '{setupComplete}',
  'false'::jsonb
)
WHERE key = 'dashboard_config';
