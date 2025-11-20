import { Header } from "encore.dev/api";
import { AuditHeaders } from "./logger";

export function extractAuditHeaders(
  xForwardedFor?: Header<"x-forwarded-for">,
  xRealIp?: Header<"x-real-ip">,
  cfConnectingIp?: Header<"cf-connecting-ip">,
  trueClientIp?: Header<"true-client-ip">,
  userAgent?: Header<"user-agent">
): AuditHeaders {
  return {
    xForwardedFor,
    xRealIp,
    cfConnectingIp,
    trueClientIp,
    userAgent,
  };
}
