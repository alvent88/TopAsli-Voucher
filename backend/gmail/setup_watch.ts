import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";

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

interface WatchResponse {
  historyId: string;
  expiration: string;
}

export interface SetupGmailWatchResponse {
  success: boolean;
  message: string;
  historyId?: string;
  expiration?: string;
  expirationDate?: string;
}

export const setupGmailWatch = api<{}, SetupGmailWatchResponse>(
  { expose: true, method: "POST", path: "/gmail/setup-watch", auth: true },
  async () => {
    console.log("=== Setting up Gmail Watch ===");

    try {
      const accessToken = await getAccessToken();
      console.log("✅ Access token obtained");

      // Setup watch on Gmail mailbox
      const watchRequest = {
        topicName: "projects/topasli-redeem-system/topics/gmail-notifications",
        labelIds: ["INBOX"],
        labelFilterAction: "include",
      };

      console.log("Watch request:", watchRequest);

      const response = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/watch",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(watchRequest),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error("❌ Failed to setup watch:", error);
        throw new Error(`Failed to setup watch: ${error}`);
      }

      const watchResponse = (await response.json()) as WatchResponse;
      console.log("✅ Watch setup successful:", watchResponse);

      // Calculate expiration date
      const expirationMs = parseInt(watchResponse.expiration);
      const expirationDate = new Date(expirationMs);

      return {
        success: true,
        message: "Gmail watch setup successful! Push notifications are now active.",
        historyId: watchResponse.historyId,
        expiration: watchResponse.expiration,
        expirationDate: expirationDate.toISOString(),
      };
    } catch (error: any) {
      console.error("❌ Setup watch error:", error);
      return {
        success: false,
        message: error.message || "Failed to setup Gmail watch",
      };
    }
  }
);
