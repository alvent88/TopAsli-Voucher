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

export interface StopGmailWatchResponse {
  success: boolean;
  message: string;
}

export const stopGmailWatch = api<{}, StopGmailWatchResponse>(
  { expose: true, method: "POST", path: "/gmail/stop-watch", auth: true },
  async () => {
    console.log("=== Stopping Gmail Watch ===");

    try {
      const accessToken = await getAccessToken();
      console.log("✅ Access token obtained");

      // Stop Gmail watch
      const response = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/stop",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error("❌ Failed to stop watch:", error);
        throw new Error(`Failed to stop watch: ${error}`);
      }

      console.log("✅ Gmail watch stopped successfully");

      return {
        success: true,
        message: "Gmail watch stopped successfully! Push notifications are now disabled.",
      };
    } catch (error: any) {
      console.error("❌ Stop watch error:", error);
      return {
        success: false,
        message: error.message || "Failed to stop Gmail watch",
      };
    }
  }
);
