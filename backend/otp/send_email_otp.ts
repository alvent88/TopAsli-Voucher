import { api, APIError } from "encore.dev/api";
import db from "../db";
import { secret } from "encore.dev/config";

const GMAIL_CLIENT_ID = secret("GmailClientId");
const GMAIL_CLIENT_SECRET = secret("GmailClientSecret");
const GMAIL_REFRESH_TOKEN = secret("GmailRefreshToken");

export interface SendEmailOTPRequest {
  email: string;
}

export interface SendEmailOTPResponse {
  success: boolean;
  message: string;
}

interface AccessTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

async function getAccessToken(): Promise<string> {
  const clientId = GMAIL_CLIENT_ID();
  const clientSecret = GMAIL_CLIENT_SECRET();
  const refreshToken = GMAIL_REFRESH_TOKEN();

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  const data = (await response.json()) as AccessTokenResponse;
  return data.access_token;
}

async function sendEmail(accessToken: string, to: string, subject: string, body: string): Promise<void> {
  const email = [
    `To: ${to}`,
    `Subject: ${subject}`,
    `Content-Type: text/html; charset=utf-8`,
    ``,
    body,
  ].join("\r\n");

  const encodedEmail = Buffer.from(email)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      raw: encodedEmail,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }
}

export const sendEmailOTP = api<SendEmailOTPRequest, SendEmailOTPResponse>(
  { expose: true, method: "POST", path: "/otp/send-email", auth: false },
  async ({ email }) => {
    try {
      console.log("=== SEND EMAIL OTP START ===");
      console.log("Email:", email);

      const normalizedEmail = email.toLowerCase().trim();

      const timestamp = Math.floor(Date.now() / 1000);
      const expiresAt = timestamp + 300;

      const recent = await db.queryRow<{ created_at: number }>`
        SELECT created_at 
        FROM email_otp_codes 
        WHERE email = ${normalizedEmail}
        ORDER BY created_at DESC
        LIMIT 1
      `;

      if (recent) {
        const timeSinceLastRequest = timestamp - recent.created_at;
        const MIN_REQUEST_INTERVAL = 60;

        if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
          const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
          throw APIError.resourceExhausted(
            `Mohon tunggu ${waitTime} detik sebelum meminta OTP lagi.`
          );
        }
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      console.log("Generated OTP:", otp);

      await db.exec`
        INSERT INTO email_otp_codes (email, otp_code, created_at, verified, expires_at)
        VALUES (${normalizedEmail}, ${otp}, ${timestamp}, FALSE, ${expiresAt})
      `;

      console.log("OTP saved to database");

      const accessToken = await getAccessToken();
      console.log("Gmail access token obtained");

      const subject = "Kode Verifikasi TopAsli - OTP";
      const body = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .otp-box { background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
    .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: monospace; }
    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 TopAsli</h1>
      <p>Kode Verifikasi Email</p>
    </div>
    <div class="content">
      <p>Halo,</p>
      <p>Berikut adalah kode OTP untuk verifikasi email Anda di <strong>TopAsli</strong>:</p>
      
      <div class="otp-box">
        <div class="otp-code">${otp}</div>
      </div>
      
      <p>Kode ini berlaku selama <strong>5 menit</strong>.</p>
      
      <div class="warning">
        <strong>⚠️ Peringatan Keamanan:</strong><br>
        Jangan berikan kode ini kepada siapapun, termasuk yang mengaku sebagai tim TopAsli. Kami tidak akan pernah meminta kode OTP Anda.
      </div>
      
      <p>Jika Anda tidak meminta kode ini, abaikan email ini atau hubungi customer service kami.</p>
      
      <div class="footer">
        <p>Email ini dikirim otomatis, mohon tidak membalas.</p>
        <p>&copy; ${new Date().getFullYear()} TopAsli - Platform Top-Up Game Terpercaya</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

      await sendEmail(accessToken, normalizedEmail, subject, body);
      console.log("Email sent successfully");

      console.log("=== SEND EMAIL OTP SUCCESS ===");

      return {
        success: true,
        message: "Kode OTP telah dikirim ke email Anda. Periksa juga folder spam jika tidak terlihat di inbox.",
      };
    } catch (err: any) {
      console.error("=== SEND EMAIL OTP ERROR ===");
      console.error("Error:", err);

      if (err instanceof APIError) {
        throw err;
      }

      throw APIError.internal(err.message || "Gagal mengirim OTP via email", err);
    }
  }
);

export interface VerifyEmailOTPRequest {
  email: string;
  otp: string;
}

export interface VerifyEmailOTPResponse {
  success: boolean;
  message: string;
}

export const verifyEmailOTP = api<VerifyEmailOTPRequest, VerifyEmailOTPResponse>(
  { expose: true, method: "POST", path: "/otp/verify-email", auth: false },
  async ({ email, otp }) => {
    try {
      console.log("=== VERIFY EMAIL OTP START ===");
      console.log("Email:", email);
      console.log("OTP:", otp);

      const normalizedEmail = email.toLowerCase().trim();
      const currentTime = Math.floor(Date.now() / 1000);

      const row = await db.queryRow<{
        otp_code: string;
        created_at: number;
        verified: boolean;
        expires_at: number;
      }>`
        SELECT otp_code, created_at, verified, expires_at
        FROM email_otp_codes
        WHERE email = ${normalizedEmail}
        ORDER BY created_at DESC
        LIMIT 1
      `;

      if (!row) {
        throw APIError.invalidArgument(
          "Kode OTP tidak ditemukan. Silakan kirim ulang OTP."
        );
      }

      if (row.verified) {
        throw APIError.invalidArgument(
          "Kode OTP sudah pernah digunakan. Silakan kirim ulang OTP."
        );
      }

      if (currentTime > row.expires_at) {
        throw APIError.invalidArgument(
          "Kode OTP sudah kadaluarsa (lebih dari 5 menit). Silakan kirim ulang OTP."
        );
      }

      if (row.otp_code !== otp) {
        throw APIError.invalidArgument("Kode OTP salah. Silakan coba lagi.");
      }

      await db.exec`
        UPDATE email_otp_codes
        SET verified = TRUE
        WHERE email = ${normalizedEmail}
        AND otp_code = ${otp}
        AND verified = FALSE
      `;

      console.log("=== VERIFY EMAIL OTP SUCCESS ===");

      return {
        success: true,
        message: "Verifikasi OTP berhasil!",
      };
    } catch (err: any) {
      console.error("=== VERIFY EMAIL OTP ERROR ===");
      console.error("Error:", err);

      if (err instanceof APIError) {
        throw err;
      }

      throw APIError.internal(err.message || "Gagal memverifikasi OTP", err);
    }
  }
);
