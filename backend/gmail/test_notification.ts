import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import db from "../db";

const GMAIL_CLIENT_ID = secret("GmailClientId");
const GMAIL_CLIENT_SECRET = secret("GmailClientSecret");
const GMAIL_REFRESH_TOKEN = secret("GmailRefreshToken");

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

interface GmailListResponse {
  messages?: Array<{ id: string; threadId: string }>;
  nextPageToken?: string;
  resultSizeEstimate?: number;
}

interface GmailMessageResponse {
  id: string;
  threadId: string;
  snippet: string;
  internalDate: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    body?: {
      data?: string;
    };
    parts?: Array<{
      mimeType: string;
      body?: {
        data?: string;
      };
      parts?: Array<{
        mimeType: string;
        body?: {
          data?: string;
        };
      }>;
    }>;
  };
}

function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64").toString("utf-8");
}

function extractHeader(headers: Array<{ name: string; value: string }>, headerName: string): string {
  const header = headers.find((h) => h.name.toLowerCase() === headerName.toLowerCase());
  return header?.value || "";
}

function extractEmailBody(payload: GmailMessageResponse["payload"]): string {
  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        return decodeBase64Url(part.body.data);
      }
      
      if (part.parts) {
        for (const nestedPart of part.parts) {
          if (nestedPart.mimeType === "text/plain" && nestedPart.body?.data) {
            return decodeBase64Url(nestedPart.body.data);
          }
        }
      }
    }

    for (const part of payload.parts) {
      if (part.mimeType === "text/html" && part.body?.data) {
        return decodeBase64Url(part.body.data);
      }
      
      if (part.parts) {
        for (const nestedPart of part.parts) {
          if (nestedPart.mimeType === "text/html" && nestedPart.body?.data) {
            return decodeBase64Url(nestedPart.body.data);
          }
        }
      }
    }
  }

  return "";
}

async function listMessages(accessToken: string, query: string): Promise<GmailListResponse> {
  const url = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
  url.searchParams.set("q", query);
  url.searchParams.set("maxResults", "1");

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to list messages: ${error}`);
  }

  return (await response.json()) as GmailListResponse;
}

async function getMessage(accessToken: string, messageId: string): Promise<GmailMessageResponse> {
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get message: ${error}`);
  }

  return (await response.json()) as GmailMessageResponse;
}

async function sendWhatsAppNotification(phone: string, emailFrom: string, emailSubject: string, emailBody: string): Promise<void> {
  const config = await db.queryRow<{ value: string }>`
    SELECT value FROM admin_config WHERE key = 'dashboard_config'
  `;

  if (!config) {
    throw new Error("WhatsApp config not found");
  }

  const dashboardConfig = JSON.parse(config.value);
  const fonnteToken = dashboardConfig.whatsapp?.fonnteToken;

  if (!fonnteToken) {
    throw new Error("Fonnte token not configured");
  }

  const message = `📧 *Email Baru Masuk!*

*Dari:* ${emailFrom}
*Subject:* ${emailSubject}

*Isi Email:*
${emailBody.substring(0, 500)}${emailBody.length > 500 ? "..." : ""}

_Notifikasi otomatis dari Gmail_`;

  const response = await fetch("https://api.fonnte.com/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": fonnteToken,
    },
    body: JSON.stringify({
      target: phone,
      message: message,
      countryCode: "62",
    }),
  });

  const result = await response.json();
  console.log("WhatsApp send result:", result);

  if (!response.ok || result.status === false) {
    throw new Error(`Failed to send WhatsApp: ${JSON.stringify(result)}`);
  }
}

export interface TestEmailNotificationResponse {
  success: boolean;
  message: string;
  emailFound: boolean;
  emailDetails?: {
    from: string;
    subject: string;
    date: string;
    snippet: string;
  };
  whatsappSent: boolean;
  csNumbers: string[];
}

export const testEmailNotification = api<{}, TestEmailNotificationResponse>(
  { expose: true, method: "POST", path: "/gmail/test-notification", auth: true },
  async () => {
    console.log("=== Testing Email Notification to WhatsApp ===");

    try {
      const accessToken = await getAccessToken();
      console.log("✅ Access token obtained");

      // Search for latest email from alvent88@gmail.com
      const query = "from:alvent88@gmail.com";
      console.log("Search query:", query);
      
      const list = await listMessages(accessToken, query);
      
      if (!list.messages || list.messages.length === 0) {
        console.log("⚠️ No email found from alvent88@gmail.com");
        return {
          success: true,
          message: "No email found from alvent88@gmail.com",
          emailFound: false,
          whatsappSent: false,
          csNumbers: [],
        };
      }

      // Get the latest email
      const messageId = list.messages[0].id;
      console.log(`Fetching message ${messageId}...`);
      
      const fullMessage = await getMessage(accessToken, messageId);
      
      const from = extractHeader(fullMessage.payload.headers, "From");
      const subject = extractHeader(fullMessage.payload.headers, "Subject");
      const date = extractHeader(fullMessage.payload.headers, "Date");
      const body = extractEmailBody(fullMessage.payload);
      
      console.log(`✅ Email found: From=${from}, Subject=${subject}`);

      // Get WhatsApp CS numbers from database
      const csNumbers = await db.query<{ phone_number: string }>`
        SELECT phone_number FROM whatsapp_cs_numbers 
        WHERE is_active = true
        ORDER BY id ASC
      `;

      if (csNumbers.length === 0) {
        console.log("⚠️ No active CS numbers found");
        return {
          success: true,
          message: "Email found but no active CS numbers to send notification",
          emailFound: true,
          emailDetails: {
            from,
            subject,
            date,
            snippet: fullMessage.snippet,
          },
          whatsappSent: false,
          csNumbers: [],
        };
      }

      console.log(`Found ${csNumbers.length} active CS numbers`);

      // Send WhatsApp notification to all CS numbers
      const sentNumbers: string[] = [];
      
      for (const cs of csNumbers) {
        try {
          console.log(`Sending WhatsApp to ${cs.phone_number}...`);
          await sendWhatsAppNotification(cs.phone_number, from, subject, body);
          sentNumbers.push(cs.phone_number);
          console.log(`✅ Sent to ${cs.phone_number}`);
        } catch (error: any) {
          console.error(`❌ Failed to send to ${cs.phone_number}:`, error.message);
        }
      }

      return {
        success: true,
        message: `Email found and sent to ${sentNumbers.length} CS number(s)`,
        emailFound: true,
        emailDetails: {
          from,
          subject,
          date,
          snippet: fullMessage.snippet,
        },
        whatsappSent: sentNumbers.length > 0,
        csNumbers: sentNumbers,
      };

    } catch (error: any) {
      console.error("❌ Email notification error:", error);
      return {
        success: false,
        message: error.message || "Unknown error",
        emailFound: false,
        whatsappSent: false,
        csNumbers: [],
      };
    }
  }
);
