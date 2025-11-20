import { getAuditMetadata } from './auditMetadata';

export async function withAuditMetadata<T extends Record<string, any>>(
  data: T
): Promise<T & { _auditMetadata: { ipAddress: string; userAgent: string } }> {
  const metadata = await getAuditMetadata();
  return {
    ...data,
    _auditMetadata: metadata,
  };
}
