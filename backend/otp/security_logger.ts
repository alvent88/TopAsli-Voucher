import db from "../db";

export type AlertSeverity = "low" | "medium" | "high" | "critical";
export type AlertType = 
  | "rate_limit_exceeded"
  | "brute_force_otp"
  | "multiple_ip_attack"
  | "fonnte_api_failure"
  | "suspicious_login"
  | "account_takeover_attempt"
  | "other";

export interface SecurityAlertData {
  alertType: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  phoneNumber?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, any>;
}

export async function createSecurityAlert(data: SecurityAlertData): Promise<void> {
  try {
    const metadataJson = data.metadata ? JSON.stringify(data.metadata) : null;

    await db.exec`
      INSERT INTO security_alerts (
        alert_type,
        severity,
        title,
        description,
        phone_number,
        ip_address,
        user_agent,
        metadata,
        status,
        created_at,
        updated_at
      ) VALUES (
        ${data.alertType},
        ${data.severity},
        ${data.title},
        ${data.description},
        ${data.phoneNumber},
        ${data.ipAddress},
        ${data.userAgent},
        ${metadataJson},
        'new',
        NOW(),
        NOW()
      )
    `;

    console.warn(`[SECURITY ALERT CREATED] ${data.alertType} - ${data.severity}`);
    console.warn(`  Title: ${data.title}`);
    console.warn(`  Phone: ${data.phoneNumber || 'N/A'}`);
    console.warn(`  IP: ${data.ipAddress || 'N/A'}`);
    console.warn(`  Description: ${data.description}`);
  } catch (error) {
    console.error("[SECURITY ALERT ERROR] Failed to create security alert:", error);
  }
}

export async function logRateLimitExceeded(
  phoneNumber: string,
  ipAddress: string | null,
  limitType: "phone" | "ip",
  currentCount: number,
  maxLimit: number
): Promise<void> {
  await createSecurityAlert({
    alertType: "rate_limit_exceeded",
    severity: "medium",
    title: `Rate Limit Exceeded - ${limitType === "phone" ? "Phone Number" : "IP Address"}`,
    description: `${limitType === "phone" ? "Phone number" : "IP address"} ${
      limitType === "phone" ? phoneNumber : ipAddress
    } exceeded OTP request limit (${currentCount}/${maxLimit} in 15 minutes)`,
    phoneNumber: limitType === "phone" ? phoneNumber : null,
    ipAddress,
    metadata: {
      limitType,
      currentCount,
      maxLimit,
      windowMinutes: 15,
    },
  });
}

export async function logBruteForceOTP(
  phoneNumber: string,
  ipAddress: string | null,
  failedAttempts: number
): Promise<void> {
  const severity: AlertSeverity = failedAttempts >= 10 ? "high" : failedAttempts >= 5 ? "medium" : "low";

  await createSecurityAlert({
    alertType: "brute_force_otp",
    severity,
    title: "Brute Force OTP Attempt Detected",
    description: `Multiple failed OTP verification attempts (${failedAttempts} attempts) detected for phone number ${phoneNumber}`,
    phoneNumber,
    ipAddress,
    metadata: {
      failedAttempts,
      threshold: 5,
    },
  });
}

export async function logMultipleIPAttack(
  phoneNumber: string,
  ipAddresses: string[],
  timeWindowMinutes: number
): Promise<void> {
  await createSecurityAlert({
    alertType: "multiple_ip_attack",
    severity: "high",
    title: "Multiple IP Addresses Detected",
    description: `Phone number ${phoneNumber} received OTP requests from ${ipAddresses.length} different IP addresses in ${timeWindowMinutes} minutes`,
    phoneNumber,
    ipAddress: ipAddresses.join(", "),
    metadata: {
      ipAddresses,
      ipCount: ipAddresses.length,
      timeWindowMinutes,
    },
  });
}

export async function logFonnteAPIFailure(
  phoneNumber: string,
  ipAddress: string | null,
  reason: string,
  userAgent: string | null
): Promise<void> {
  await createSecurityAlert({
    alertType: "fonnte_api_failure",
    severity: "low",
    title: "Fonnte API Send Failure",
    description: `Failed to send OTP via Fonnte API to ${phoneNumber}. Reason: ${reason}`,
    phoneNumber,
    ipAddress,
    userAgent,
    metadata: {
      reason,
      service: "fonnte",
    },
  });
}

export async function logSuspiciousLogin(
  phoneNumber: string,
  ipAddress: string | null,
  reason: string,
  userAgent: string | null
): Promise<void> {
  await createSecurityAlert({
    alertType: "suspicious_login",
    severity: "medium",
    title: "Suspicious Login Attempt",
    description: `Suspicious login activity detected for phone number ${phoneNumber}. ${reason}`,
    phoneNumber,
    ipAddress,
    userAgent,
    metadata: {
      reason,
    },
  });
}

export async function checkAndLogMultipleIPActivity(
  phoneNumber: string,
  currentIP: string | null
): Promise<void> {
  if (!currentIP) return;

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  const recentIPsGen = db.query<{ ip_address: string }>`
    SELECT DISTINCT ip_address
    FROM otp_codes
    WHERE phone_number = ${phoneNumber}
      AND created_timestamp > ${fiveMinutesAgo}
      AND ip_address IS NOT NULL
      AND ip_address != ''
  `;

  const recentIPs: any[] = [];
  for await (const row of recentIPsGen) {
    recentIPs.push(row);
  }
  const uniqueIPs = [...new Set(recentIPs.map((row: any) => row.ip_address))] as string[];

  if (uniqueIPs.length >= 3) {
    await logMultipleIPAttack(phoneNumber, uniqueIPs, 5);
  }
}

export async function checkAndLogBruteForceOTP(
  phoneNumber: string,
  ipAddress: string | null
): Promise<void> {
  const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 5 * 60;

  const failedAttemptsGen = db.query<{ count: number }>`
    SELECT COUNT(*) as count
    FROM otp_codes
    WHERE phone_number = ${phoneNumber}
      AND created_at > ${fiveMinutesAgo}
      AND verified = FALSE
  `;

  const failedAttempts: any[] = [];
  for await (const row of failedAttemptsGen) {
    failedAttempts.push(row);
  }
  const count = failedAttempts[0]?.count || 0;

  if (count >= 5) {
    await logBruteForceOTP(phoneNumber, ipAddress, count);
  }
}
