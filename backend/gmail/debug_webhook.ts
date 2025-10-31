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

  const data = (await response.json()) as AccessTokenResponse;
  return data.access_token;
}

export interface DebugWebhookResponse {
  success: boolean;
  configEmail: string;
  latestEmailFrom: string;
  latestEmailSubject: string;
  latestEmailSnippet: string;
  latestMessageId: string;
  alreadyProcessed: boolean;
  error?: string;
}

export const debugWebhook = api<{}, DebugWebhookResponse>(
  { expose: true, method: "POST", path: "/gmail/debug-webhook", auth: true },
  async () => {
    console.log("=== Debug Webhook ===");

    try {
      // Get UniPlay sender email from config
      const config = await db.queryRow<{ value: string }>`
        SELECT value FROM admin_config WHERE key = 'dashboard_config'
      `;

      let uniplaySenderEmail = "alvent88@gmail.com";
      if (config) {
        const dashboardConfig = JSON.parse(config.value);
        if (dashboardConfig.gmail?.uniplaySenderEmail) {
          uniplaySenderEmail = dashboardConfig.gmail.uniplaySenderEmail;
        }
      }

      console.log(`Looking for emails from: ${uniplaySenderEmail}`);

      // Get access token
      const accessToken = await getAccessToken();

      // List the latest message from UniPlay sender
      const listResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=1&q=from:${uniplaySenderEmail}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!listResponse.ok) {
        throw new Error("Failed to list messages");
      }

      const listData = (await listResponse.json()) as any;

      if (!listData.messages || listData.messages.length === 0) {
        return {
          success: false,
          configEmail: uniplaySenderEmail,
          latestEmailFrom: "",
          latestEmailSubject: "",
          latestEmailSnippet: "",
          latestMessageId: "",
          alreadyProcessed: false,
          error: `No messages found from ${uniplaySenderEmail}`,
        };
      }

      const latestMessageId = listData.messages[0].id;

      // Get full message details
      const messageResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${latestMessageId}?format=full`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const fullMessage = (await messageResponse.json()) as any;

      const from = fullMessage.payload.headers.find((h: any) => h.name.toLowerCase() === "from")?.value || "";
      const subject = fullMessage.payload.headers.find((h: any) => h.name.toLowerCase() === "subject")?.value || "";

      // Check if already processed
      const alreadyProcessed = await db.queryRow<{ message_id: string }>`
        SELECT message_id FROM processed_email_messages
        WHERE message_id = ${latestMessageId}
      `;

      return {
        success: true,
        configEmail: uniplaySenderEmail,
        latestEmailFrom: from,
        latestEmailSubject: subject,
        latestEmailSnippet: fullMessage.snippet || "",
        latestMessageId: latestMessageId,
        alreadyProcessed: !!alreadyProcessed,
      };
    } catch (error: any) {
      console.error("Debug webhook error:", error);
      return {
        success: false,
        configEmail: "",
        latestEmailFrom: "",
        latestEmailSubject: "",
        latestEmailSnippet: "",
        latestMessageId: "",
        alreadyProcessed: false,
        error: error.message || "Unknown error",
      };
    }
  }
);
