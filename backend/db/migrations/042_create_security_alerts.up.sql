CREATE TYPE alert_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE alert_type AS ENUM (
  'rate_limit_exceeded',
  'brute_force_otp',
  'multiple_ip_attack',
  'fonnte_api_failure',
  'suspicious_login',
  'account_takeover_attempt',
  'other'
);
CREATE TYPE alert_status AS ENUM ('new', 'investigating', 'resolved', 'false_positive');

CREATE TABLE IF NOT EXISTS security_alerts (
  id BIGSERIAL PRIMARY KEY,
  alert_type alert_type NOT NULL,
  severity alert_severity NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  phone_number TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  status alert_status NOT NULL DEFAULT 'new',
  resolved_by TEXT,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_alerts_status ON security_alerts(status);
CREATE INDEX IF NOT EXISTS idx_security_alerts_severity ON security_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_security_alerts_type ON security_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_security_alerts_created ON security_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_alerts_phone ON security_alerts(phone_number);
CREATE INDEX IF NOT EXISTS idx_security_alerts_ip ON security_alerts(ip_address);
CREATE INDEX IF NOT EXISTS idx_security_alerts_unresolved ON security_alerts(status, created_at DESC) 
  WHERE status IN ('new', 'investigating');
