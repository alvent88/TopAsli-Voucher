import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";

// Gmail API credentials from Google Cloud Console
const GMAIL_CLIENT_ID = secret("GmailClientId");
const GMAIL_CLIENT_SECRET = secret("GmailClientSecret");
const GMAIL_REFRESH_TOKEN = secret("GmailRefreshToken");

interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    body: {
      data?: string;
    };
    parts?: Array<{
      mimeType: string;
      body: {
        data?: string;
      };
    }>;
  };
}

interface GmailListResponse {
  messages?: Array<{ id: string; threadId: string }>;
  nextPageToken?: string;
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

async function listMessages(accessToken: string, query: string = ""): Promise<GmailListResponse> {
  const url = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
  if (query) {
    url.searchParams.set("q", query);
  }
  url.searchParams.set("maxResults", "10");

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

async function getMessage(accessToken: string, messageId: string): Promise<GmailMessage> {
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

  return (await response.json()) as GmailMessage;
}

function decodeBase64Url(data: string): string {
  // Gmail returns base64url encoded data
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64").toString("utf-8");
}

function extractEmailBody(message: GmailMessage): string {
  if (message.payload.body.data) {
    return decodeBase64Url(message.payload.body.data);
  }

  if (message.payload.parts) {
    for (const part of message.payload.parts) {
      if (part.mimeType === "text/plain" && part.body.data) {
        return decodeBase64Url(part.body.data);
      }
    }
    for (const part of message.payload.parts) {
      if (part.mimeType === "text/html" && part.body.data) {
        return decodeBase64Url(part.body.data);
      }
    }
  }

  return message.snippet || "";
}

function extractHeader(message: GmailMessage, headerName: string): string {
  const header = message.payload.headers.find(
    (h) => h.name.toLowerCase() === headerName.toLowerCase()
  );
  return header?.value || "";
}

export interface TestGmailResponse {
  success: boolean;
  messageCount: number;
  messages: Array<{
    id: string;
    subject: string;
    from: string;
    date: string;
    snippet: string;
    body: string;
  }>;
}

export const testGmail = api<{}, TestGmailResponse>(
  { expose: true, method: "POST", path: "/gmail/test", auth: true },
  async () => {
    console.log("=== Testing Gmail API ===");

    try {
      const accessToken = await getAccessToken();
      console.log("✅ Access token obtained");

      // List messages from UniPlay (last 10)
      const query = "from:noreply@uniplay.id OR from:support@uniplay.id OR subject:voucher";
      const list = await listMessages(accessToken, query);

      console.log(`Found ${list.messages?.length || 0} messages`);

      const messages = [];
      
      if (list.messages) {
        for (const msg of list.messages.slice(0, 5)) {
          const fullMessage = await getMessage(accessToken, msg.id);
          
          messages.push({
            id: fullMessage.id,
            subject: extractHeader(fullMessage, "Subject"),
            from: extractHeader(fullMessage, "From"),
            date: extractHeader(fullMessage, "Date"),
            snippet: fullMessage.snippet,
            body: extractEmailBody(fullMessage),
          });
        }
      }

      return {
        success: true,
        messageCount: list.messages?.length || 0,
        messages,
      };
    } catch (error: any) {
      console.error("❌ Gmail API error:", error);
      throw error;
    }
  }
);
