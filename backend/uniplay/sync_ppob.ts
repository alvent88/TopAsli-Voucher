import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import db from "../db";

export interface SyncPPOBRequest {}

export interface SyncPPOBResponse {
  success: boolean;
  rawResponse: string;
  curlCommand: string;
}

export const syncPPOB = api<SyncPPOBRequest, SyncPPOBResponse>(
  { expose: true, method: "POST", path: "/uniplay/sync-ppob", auth: true },
  async (req: SyncPPOBRequest) => {
    const auth = getAuthData()!;
    
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Only admin can sync PPOB");
    }

    try {
      const configRow = await db.queryRow<{ value: string }>`
        SELECT value FROM admin_config WHERE key = 'dashboard_config'
      `;

      if (!configRow) {
        throw new Error("UniPlay API key not configured");
      }

      const config = JSON.parse(configRow.value);
      if (!config.uniplay?.apiKey || !config.uniplay?.baseUrl) {
        throw new Error("UniPlay API key not configured");
      }

      const now = new Date();
      const jakartaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
      const timestamp = jakartaTime.toISOString().slice(0, 19).replace('T', ' ');

      const jsonArray = {
        api_key: config.uniplay.apiKey,
        timestamp: timestamp,
      };

      const jsonString = JSON.stringify(jsonArray);

      const hmacKey = config.uniplay.apiKey + '|' + jsonString;
      const encoder = new TextEncoder();
      const keyData = encoder.encode(hmacKey);
      const messageData = encoder.encode(jsonString);

      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-512' },
        false,
        ['sign']
      );

      const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
      const signatureArray = Array.from(new Uint8Array(signatureBuffer));
      const accessTokenSignature = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const tokenResponse = await fetch(`${config.uniplay.baseUrl}/access-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "UPL-SIGNATURE": accessTokenSignature,
        },
        body: jsonString,
      });

      const tokenResponseText = await tokenResponse.text();

      if (!tokenResponse.ok) {
        throw new Error(`HTTP ${tokenResponse.status}: ${tokenResponseText}`);
      }

      const tokenData = JSON.parse(tokenResponseText);

      if (tokenData.status !== "200") {
        throw new Error(`API Error ${tokenData.status}: ${tokenData.message}`);
      }

      if (!tokenData.access_token) {
        throw new Error(`No access token in response: ${JSON.stringify(tokenData)}`);
      }

      const accessToken = tokenData.access_token;

      const ppobRequestBody = {
        api_key: config.uniplay.apiKey,
        timestamp: timestamp,
      };

      const ppobJsonString = JSON.stringify(ppobRequestBody);

      const ppobHmacKey = config.uniplay.apiKey + '|' + ppobJsonString;
      const ppobKeyData = encoder.encode(ppobHmacKey);
      const ppobMessageData = encoder.encode(ppobJsonString);

      const ppobCryptoKey = await crypto.subtle.importKey(
        'raw',
        ppobKeyData,
        { name: 'HMAC', hash: 'SHA-512' },
        false,
        ['sign']
      );

      const ppobSignatureBuffer = await crypto.subtle.sign('HMAC', ppobCryptoKey, ppobMessageData);
      const ppobSignatureArray = Array.from(new Uint8Array(ppobSignatureBuffer));
      const ppobSignature = ppobSignatureArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const ppobResponse = await fetch(`${config.uniplay.baseUrl}/inquiry-ppob`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "UPL-ACCESS-TOKEN": accessToken,
          "UPL-SIGNATURE": ppobSignature,
        },
        body: ppobJsonString,
      });

      const ppobResponseText = await ppobResponse.text();

      const curlCommand = `curl --location 'https://api-reseller.uniplay.id/v1/inquiry-ppob' \\
--header 'UPL-ACCESS-TOKEN: FROM-GET-ACCESS-TOKEN' \\
--header 'UPL-SIGNATURE: GENERATED SIGNATURE' \\
--data '{"api_key":"YOUR API KEY","timestamp":"YYYY-MM-DD hh:mm:ss"}'`;

      return {
        success: ppobResponse.ok,
        rawResponse: ppobResponseText,
        curlCommand: curlCommand,
      };
    } catch (err) {
      console.error("❌ Failed to sync PPOB:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      throw APIError.internal(`Failed to sync PPOB: ${errorMessage}`);
    }
  }
);
