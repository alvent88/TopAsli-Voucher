import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";

const GMAIL_CLIENT_ID = secret("GmailClientId");
const GMAIL_CLIENT_SECRET = secret("GmailClientSecret");
const GMAIL_REFRESH_TOKEN = secret("GmailRefreshToken");

interface GmailMessage {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  snippet: string;
  body: string;
}

export interface TestGmailResponse {
  success: boolean;
  messageCount: number;
  messages: GmailMessage[];
  error?: string;
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

  console.log("=== Getting Gmail Access Token ===");
  console.log("Client ID:", clientId.substring(0, 20) + "...");

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
    console.error("❌ Failed to get access token:", error);
    throw new Error(`Failed to get access token: ${error}`);
  }

  const data = (await response.json()) as AccessTokenResponse;
  console.log("✅ Access token obtained, expires in:", data.expires_in, "seconds");
  
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
  // Try direct body first
  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  // Try parts
  if (payload.parts) {
    // Try to find text/plain first
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        return decodeBase64Url(part.body.data);
      }
      
      // Check nested parts
      if (part.parts) {
        for (const nestedPart of part.parts) {
          if (nestedPart.mimeType === "text/plain" && nestedPart.body?.data) {
            return decodeBase64Url(nestedPart.body.data);
          }
        }
      }
    }

    // If no text/plain, try text/html
    for (const part of payload.parts) {
      if (part.mimeType === "text/html" && part.body?.data) {
        return decodeBase64Url(part.body.data);
      }
      
      // Check nested parts
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

export const testGmail = api<{}, TestGmailResponse>(
  { expose: true, method: "POST", path: "/gmail/test", auth: true },
  async () => {
    console.log("=== Testing Gmail API ===");

    try {
      const accessToken = await getAccessToken();
      console.log("✅ Access token obtained");

      // Search for emails from UniPlay
      const query = "from:@uniplay.id OR subject:voucher";
      console.log("Search query:", query);
      
      const list = await listMessages(accessToken, query);
      console.log(`Found ${list.resultSizeEstimate || 0} messages (showing max 10)`);

      const messages: GmailMessage[] = [];
      
      if (list.messages && list.messages.length > 0) {
        console.log(`Processing ${list.messages.length} messages...`);
        
        for (const msg of list.messages.slice(0, 5)) {
          console.log(`Fetching message ${msg.id}...`);
          const fullMessage = await getMessage(accessToken, msg.id);
          
          const from = extractHeader(fullMessage.payload.headers, "From");
          const to = extractHeader(fullMessage.payload.headers, "To");
          const subject = extractHeader(fullMessage.payload.headers, "Subject");
          const date = extractHeader(fullMessage.payload.headers, "Date");
          const body = extractEmailBody(fullMessage.payload);
          
          console.log(`✅ Message ${msg.id}: From=${from}, Subject=${subject}`);
          
          messages.push({
            id: fullMessage.id,
            threadId: fullMessage.threadId,
            from,
            to,
            subject,
            date,
            snippet: fullMessage.snippet,
            body: body.substring(0, 1000), // Limit to 1000 chars
          });
        }
      } else {
        console.log("⚠️ No messages found matching query");
      }

      return {
        success: true,
        messageCount: list.resultSizeEstimate || 0,
        messages,
      };
    } catch (error: any) {
      console.error("❌ Gmail API error:", error);
      return {
        success: false,
        messageCount: 0,
        messages: [],
        error: error.message || "Unknown error",
      };
    }
  }
);
