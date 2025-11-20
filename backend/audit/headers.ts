import { Header } from "encore.dev/api";

export interface RequestMetadata {
  ipAddress: string;
  userAgent: string;
}

export function extractRequestMetadata(
  xForwardedFor?: Header<"x-forwarded-for">,
  xRealIp?: Header<"x-real-ip">,
  cfConnectingIp?: Header<"cf-connecting-ip">,
  trueClientIp?: Header<"true-client-ip">,
  userAgent?: Header<"user-agent">
): RequestMetadata {
  const ipAddress = xForwardedFor || xRealIp || cfConnectingIp || trueClientIp || "unknown";
  const finalUserAgent = userAgent || "unknown";
  
  return {
    ipAddress,
    userAgent: finalUserAgent,
  };
}
