import { APIError } from "encore.dev/api";
import db from "../db";
import { logRateLimitExceeded, logFonnteAPIFailure } from "./security_logger";

const MAX_OTP_PER_PHONE_15MIN = 10;
const MAX_OTP_PER_IP_15MIN = 20;
const COOLDOWN_SECONDS = 60;
const WINDOW_MINUTES = 15;

interface RateLimitCheck {
  allowed: boolean;
  remainingRequests?: number;
  resetAt?: Date;
  cooldownSeconds?: number;
}

export async function checkPhoneRateLimit(phoneNumber: string): Promise<RateLimitCheck> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - WINDOW_MINUTES * 60 * 1000);

  const limitRow = await db.queryRow<{
    request_count: number;
    window_start: Date;
    last_request_at: Date;
  }>`
    SELECT request_count, window_start, last_request_at
    FROM otp_rate_limit
    WHERE phone_number = ${phoneNumber}
  `;

  if (!limitRow) {
    return { allowed: true };
  }

  const lastRequestAge = (now.getTime() - new Date(limitRow.last_request_at).getTime()) / 1000;
  if (lastRequestAge < COOLDOWN_SECONDS) {
    await logRateLimitExceeded(phoneNumber, null, "phone", limitRow.request_count, MAX_OTP_PER_PHONE_15MIN);
    throw APIError.resourceExhausted(
      `Silakan tunggu ${Math.ceil(COOLDOWN_SECONDS - lastRequestAge)} detik sebelum meminta OTP lagi`
    );
  }

  if (new Date(limitRow.window_start) < windowStart) {
    return { allowed: true };
  }

  if (limitRow.request_count >= MAX_OTP_PER_PHONE_15MIN) {
    const resetAt = new Date(new Date(limitRow.window_start).getTime() + WINDOW_MINUTES * 60 * 1000);
    const minutesUntilReset = Math.ceil((resetAt.getTime() - now.getTime()) / 60000);
    
    await logRateLimitExceeded(phoneNumber, null, "phone", limitRow.request_count, MAX_OTP_PER_PHONE_15MIN);
    throw APIError.resourceExhausted(
      `Batas maksimal OTP tercapai (${MAX_OTP_PER_PHONE_15MIN} kali per 15 menit). Silakan coba lagi dalam ${minutesUntilReset} menit`
    );
  }

  return {
    allowed: true,
    remainingRequests: MAX_OTP_PER_PHONE_15MIN - limitRow.request_count,
    resetAt: new Date(new Date(limitRow.window_start).getTime() + WINDOW_MINUTES * 60 * 1000),
  };
}

export async function checkIPRateLimit(ipAddress: string): Promise<RateLimitCheck> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - WINDOW_MINUTES * 60 * 1000);

  const limitRow = await db.queryRow<{
    request_count: number;
    window_start: Date;
    last_request_at: Date;
  }>`
    SELECT request_count, window_start, last_request_at
    FROM otp_ip_rate_limit
    WHERE ip_address = ${ipAddress}
  `;

  if (!limitRow) {
    return { allowed: true };
  }

  if (new Date(limitRow.window_start) < windowStart) {
    return { allowed: true };
  }

  if (limitRow.request_count >= MAX_OTP_PER_IP_15MIN) {
    const resetAt = new Date(new Date(limitRow.window_start).getTime() + WINDOW_MINUTES * 60 * 1000);
    const minutesUntilReset = Math.ceil((resetAt.getTime() - now.getTime()) / 60000);
    
    await logRateLimitExceeded("", ipAddress, "ip", limitRow.request_count, MAX_OTP_PER_IP_15MIN);
    throw APIError.resourceExhausted(
      `Terlalu banyak permintaan OTP dari IP ini. Silakan coba lagi dalam ${minutesUntilReset} menit`
    );
  }

  return {
    allowed: true,
    remainingRequests: MAX_OTP_PER_IP_15MIN - limitRow.request_count,
  };
}

export async function recordOTPRequest(
  phoneNumber: string,
  ipAddress: string | null,
  userAgent: string | null
): Promise<void> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - WINDOW_MINUTES * 60 * 1000);

  await db.exec`
    INSERT INTO otp_rate_limit (phone_number, request_count, window_start, last_request_at)
    VALUES (${phoneNumber}, 1, NOW(), NOW())
    ON CONFLICT (phone_number) DO UPDATE SET
      request_count = CASE
        WHEN otp_rate_limit.window_start < ${windowStart} THEN 1
        ELSE otp_rate_limit.request_count + 1
      END,
      window_start = CASE
        WHEN otp_rate_limit.window_start < ${windowStart} THEN NOW()
        ELSE otp_rate_limit.window_start
      END,
      last_request_at = NOW()
  `;

  if (ipAddress) {
    await db.exec`
      INSERT INTO otp_ip_rate_limit (ip_address, request_count, window_start, last_request_at)
      VALUES (${ipAddress}, 1, NOW(), NOW())
      ON CONFLICT (ip_address) DO UPDATE SET
        request_count = CASE
          WHEN otp_ip_rate_limit.window_start < ${windowStart} THEN 1
          ELSE otp_ip_rate_limit.request_count + 1
        END,
        window_start = CASE
          WHEN otp_ip_rate_limit.window_start < ${windowStart} THEN NOW()
          ELSE otp_ip_rate_limit.window_start
        END,
        last_request_at = NOW()
    `;
  }

  console.log(`[RATE LIMIT] Recorded OTP request - Phone: ${phoneNumber}, IP: ${ipAddress || 'N/A'}`);
}

export async function logSuspiciousActivity(
  phoneNumber: string,
  ipAddress: string | null,
  reason: string,
  userAgent: string | null = null
): Promise<void> {
  console.warn(`[SECURITY ALERT] Suspicious OTP activity detected`);
  console.warn(`  Phone: ${phoneNumber}`);
  console.warn(`  IP: ${ipAddress || 'N/A'}`);
  console.warn(`  Reason: ${reason}`);
  console.warn(`  Timestamp: ${new Date().toISOString()}`);
  
  await logFonnteAPIFailure(phoneNumber, ipAddress, reason, userAgent);
}
