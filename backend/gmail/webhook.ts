import { api, APIError } from "encore.dev/api";
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

// Gmail Pub/Sub webhook payload
interface PubSubMessage {
  message: {
    data: string; // base64 encoded
    messageId: string;
    publishTime: string;
  };
  subscription: string;
}

interface GmailHistoryResponse {
  history?: Array<{
    id: string;
    messages?: Array<{
      id: string;
      threadId: string;
    }>;
    messagesAdded?: Array<{
      message: {
        id: string;
        threadId: string;
      };
    }>;
  }>;
  historyId: string;
}

interface GmailMessageResponse {
  id: string;
  threadId: string;
  snippet: string;
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

  const message = `📧 *Email Baru dari ${emailFrom}!*

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

  if (!response.ok || result.status === false) {
    throw new Error(`Failed to send WhatsApp: ${JSON.stringify(result)}`);
  }
}

// Webhook endpoint to receive Gmail push notifications
export const webhook = api<PubSubMessage, { success: boolean }>(
  { expose: true, method: "POST", path: "/gmail/webhook", auth: false },
  async (req: PubSubMessage) => {
    console.log("=== Gmail Webhook Received ===");
    console.log("Message ID:", req.message.messageId);
    console.log("Publish time:", req.message.publishTime);

    try {
      // Decode the Pub/Sub message data
      const decodedData = decodeBase64Url(req.message.data);
      const notification = JSON.parse(decodedData);
      
      console.log("Notification data:", notification);
      console.log("Email address:", notification.emailAddress);
      console.log("History ID:", notification.historyId);

      // Get access token
      const accessToken = await getAccessToken();

      // Get the latest message using history API
      // For simplicity, we'll just get the latest messages and check sender
      const historyResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/history?startHistoryId=${notification.historyId}&historyTypes=messageAdded`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!historyResponse.ok) {
        console.log("⚠️ No new history found, skipping");
        return { success: true };
      }

      const historyData = (await historyResponse.json()) as GmailHistoryResponse;

      if (!historyData.history || historyData.history.length === 0) {
        console.log("⚠️ No history changes, skipping");
        return { success: true };
      }

      // Process each new message
      for (const historyItem of historyData.history) {
        if (!historyItem.messagesAdded) continue;

        for (const addedMessage of historyItem.messagesAdded) {
          const messageId = addedMessage.message.id;
          console.log(`Processing message ${messageId}...`);

          // Get full message details
          const fullMessage = await getMessage(accessToken, messageId);

          const from = extractHeader(fullMessage.payload.headers, "From");
          const subject = extractHeader(fullMessage.payload.headers, "Subject");
          const body = extractEmailBody(fullMessage.payload);

          console.log(`Message from: ${from}`);
          console.log(`Subject: ${subject}`);

          // Check if from alvent88@gmail.com
          if (from.toLowerCase().includes("alvent88@gmail.com")) {
            console.log("✅ Email from alvent88@gmail.com detected!");

            // Get all active CS numbers
            const csNumbers = await db.query<{ phone_number: string }>`
              SELECT phone_number FROM whatsapp_cs_numbers 
              WHERE is_active = true
              ORDER BY id ASC
            `;

            console.log(`Sending to ${csNumbers.length} CS numbers...`);

            // Send to all CS numbers
            for (const cs of csNumbers) {
              try {
                await sendWhatsAppNotification(cs.phone_number, from, subject, body);
                console.log(`✅ Sent to ${cs.phone_number}`);
              } catch (error: any) {
                console.error(`❌ Failed to send to ${cs.phone_number}:`, error.message);
              }
            }
          } else {
            console.log("⚠️ Email not from alvent88@gmail.com, skipping");
          }
        }
      }

      return { success: true };
    } catch (error: any) {
      console.error("❌ Webhook error:", error);
      // Return success to avoid retries from Pub/Sub
      return { success: true };
    }
  }
);
