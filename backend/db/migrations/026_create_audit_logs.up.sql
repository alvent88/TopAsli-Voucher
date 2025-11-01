CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  admin_id TEXT NOT NULL,
  admin_email TEXT,
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  old_values JSONB,
  new_values JSONB,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

COMMENT ON TABLE audit_logs IS 'Tracks all admin actions for security and compliance';
COMMENT ON COLUMN audit_logs.admin_id IS 'Clerk user ID of the admin who performed the action';
COMMENT ON COLUMN audit_logs.admin_email IS 'Email of the admin for easy reference';
COMMENT ON COLUMN audit_logs.action_type IS 'Type of action: CREATE, UPDATE, DELETE, ACTIVATE, DEACTIVATE, etc.';
COMMENT ON COLUMN audit_logs.entity_type IS 'Type of entity: USER, VOUCHER, PRODUCT, PACKAGE, CONFIG, etc.';
COMMENT ON COLUMN audit_logs.entity_id IS 'ID of the affected entity';
COMMENT ON COLUMN audit_logs.old_values IS 'Previous state of the entity (for updates/deletes)';
COMMENT ON COLUMN audit_logs.new_values IS 'New state of the entity (for creates/updates)';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional contextual information';
COMMENT ON COLUMN audit_logs.ip_address IS 'IP address of the admin';
COMMENT ON COLUMN audit_logs.user_agent IS 'Browser/client user agent';
