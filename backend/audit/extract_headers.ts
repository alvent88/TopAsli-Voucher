import type { AuditMetadata } from "./types";

export function extractAuditHeaders(
  _xForwardedFor?: any,
  _xRealIp?: any,
  _cfConnectingIp?: any,
  _trueClientIp?: any,
  _userAgent?: any
): AuditMetadata {
  return {
    ipAddress: "unknown",
    userAgent: "unknown",
  };
}
