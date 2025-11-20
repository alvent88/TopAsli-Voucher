export interface AuditMetadata {
  ipAddress?: string;
  userAgent?: string;
}

export interface WithAuditMetadata {
  _auditMetadata?: AuditMetadata;
}
