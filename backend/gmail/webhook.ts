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

function extractVoucherCode(emailBody: string, emailSubject: string): string | null {
  // Common voucher code patterns
  const patterns = [
    /code[:\s]+([A-Z0-9-]{4,})/i,
    /voucher[:\s]+([A-Z0-9-]{4,})/i,
    /kode[:\s]+([A-Z0-9-]{4,})/i,
    /gift\s+card[:\s]+([A-Z0-9-]{4,})/i,
    /redeem\s+code[:\s]+([A-Z0-9-]{4,})/i,
    /pin[:\s]+([A-Z0-9]{4,})/i,
    /\b([A-Z0-9]{12,25})\b/,  // Generic alphanumeric 12-25 chars
  ];

  const fullText = `${emailSubject}\n${emailBody}`;
  
  for (const pattern of patterns) {
    const match = fullText.match(pattern);
    if (match && match[1]) {
      console.log(`✅ Voucher code found using pattern: ${pattern}`);
      return match[1].trim();
    }
  }

  console.log("⚠️ No voucher code found in email");
  return null;
}

async function sendVoucherToUser(phone: string, voucherCode: string, productName: string, packageName: string): Promise<void> {
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

  const message = `🎉 *Pembelian Berhasil!*

*Produk:* ${productName}
*Paket:* ${packageName}

*Kode Voucher Anda:*
\`${voucherCode}\`

Terima kasih telah berbelanja! 🎮

_Auto-generated from TopAsli Redeem System_`;

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

  const result = (await response.json()) as any;

  if (!response.ok || result.status === false) {
    throw new Error(`Failed to send WhatsApp: ${JSON.stringify(result)}`);
  }
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

  const result = (await response.json()) as any;

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

      // Get UniPlay sender email from config
      const config = await db.queryRow<{ value: string }>`
        SELECT value FROM admin_config WHERE key = 'dashboard_config'
      `;

      let uniplaySenderEmail = "alvent88@gmail.com"; // Default fallback
      if (config) {
        const dashboardConfig = JSON.parse(config.value);
        if (dashboardConfig.gmail?.uniplaySenderEmail) {
          uniplaySenderEmail = dashboardConfig.gmail.uniplaySenderEmail;
        }
      }

      console.log(`Looking for emails from: ${uniplaySenderEmail}`);

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
        console.log("⚠️ Failed to list messages, skipping");
        return { success: true };
      }

      const listData = (await listResponse.json()) as any;

      if (!listData.messages || listData.messages.length === 0) {
        console.log(`⚠️ No messages from ${uniplaySenderEmail} found`);
        return { success: true };
      }

      const latestMessageId = listData.messages[0].id;
      console.log(`Latest message from ${uniplaySenderEmail}: ${latestMessageId}`);

      // Check if we already processed this message (deduplication)
      const alreadyProcessed = await db.queryRow<{ message_id: string }>`
        SELECT message_id FROM processed_email_messages
        WHERE message_id = ${latestMessageId}
      `;

      if (alreadyProcessed) {
        console.log(`⚠️ Message ${latestMessageId} already processed, skipping to prevent duplicates`);
        return { success: true };
      }

      // Get full message details
      const fullMessage = await getMessage(accessToken, latestMessageId);

      const from = extractHeader(fullMessage.payload.headers, "From");
      const subject = extractHeader(fullMessage.payload.headers, "Subject");
      const body = extractEmailBody(fullMessage.payload);

      console.log(`Message from: ${from}`);
      console.log(`Subject: ${subject}`);

      console.log(`✅ Email from ${uniplaySenderEmail} detected!`);

      // Extract voucher code from email
      const voucherCode = extractVoucherCode(body, subject);
      
      if (!voucherCode) {
        console.log("❌ No voucher code found in email, sending to CS instead");
        
        // Get all active CS numbers
        const csNumbers = await db.rawQueryAll<{ phone_number: string }>(
          `SELECT phone_number FROM whatsapp_cs_numbers 
           WHERE is_active = true
           ORDER BY id ASC`
        );

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
        
        return { success: true };
      }

      console.log(`✅ Voucher code extracted: ${voucherCode}`);

      // Find the most recent pending voucher transaction (within last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const transaction = await db.queryRow<{
        id: number;
        user_id: string;
        product_name: string;
        package_name: string;
        username: string | null;
      }>`
        SELECT t.id, t.user_id, p.name as product_name, pk.name as package_name, t.username
        FROM transactions t
        JOIN packages pk ON t.package_id = pk.id
        JOIN products p ON pk.product_id = p.id
        WHERE p.category = 'Voucher'
          AND t.status = 'pending'
          AND t.created_at >= ${fiveMinutesAgo}
        ORDER BY t.created_at DESC
        LIMIT 1
      `;

      if (!transaction) {
        console.log("⚠️ No recent voucher transaction found, sending to CS");
        
        const csNumbers = await db.rawQueryAll<{ phone_number: string }>(
          `SELECT phone_number FROM whatsapp_cs_numbers 
           WHERE is_active = true
           ORDER BY id ASC`
        );

        for (const cs of csNumbers) {
          try {
            await sendWhatsAppNotification(cs.phone_number, from, subject, `Voucher Code: ${voucherCode}\n\n${body}`);
            console.log(`✅ Sent to ${cs.phone_number}`);
          } catch (error: any) {
            console.error(`❌ Failed to send to ${cs.phone_number}:`, error.message);
          }
        }
        
        return { success: true };
      }

      console.log(`✅ Found transaction #${transaction.id} for user ${transaction.user_id}`);

      // Get user's phone number
      const user = await db.queryRow<{ phone_number: string | null }>`
        SELECT phone_number FROM users WHERE id = ${transaction.user_id}
      `;

      if (!user || !user.phone_number) {
        console.log("⚠️ User phone not found, sending to CS");
        
        const csNumbers = await db.rawQueryAll<{ phone_number: string }>(
          `SELECT phone_number FROM whatsapp_cs_numbers 
           WHERE is_active = true
           ORDER BY id ASC`
        );

        for (const cs of csNumbers) {
          try {
            await sendWhatsAppNotification(
              cs.phone_number, 
              from, 
              subject, 
              `Transaction #${transaction.id}\nUser: ${transaction.username || transaction.user_id}\nVoucher Code: ${voucherCode}\n\n${body}`
            );
            console.log(`✅ Sent to ${cs.phone_number}`);
          } catch (error: any) {
            console.error(`❌ Failed to send to ${cs.phone_number}:`, error.message);
          }
        }
        
        return { success: true };
      }

      console.log(`✅ Sending voucher to user phone: ${user.phone_number}`);

      // Send voucher code to user
      try {
        await sendVoucherToUser(
          user.phone_number, 
          voucherCode, 
          transaction.product_name, 
          transaction.package_name
        );
        console.log(`✅ Voucher sent to user ${transaction.user_id}`);
        
        // Update transaction status to success
        await db.exec`
          UPDATE transactions 
          SET status = 'success', updated_at = NOW()
          WHERE id = ${transaction.id}
        `;
        console.log(`✅ Transaction #${transaction.id} marked as success`);
        
        // Mark this email as processed
        await db.exec`
          INSERT INTO processed_email_messages (message_id, voucher_code, transaction_id, user_phone)
          VALUES (${latestMessageId}, ${voucherCode}, ${transaction.id}, ${user.phone_number})
          ON CONFLICT (message_id) DO NOTHING
        `;
        console.log(`✅ Email ${latestMessageId} marked as processed`);
        
      } catch (error: any) {
        console.error(`❌ Failed to send voucher to user:`, error.message);
        
        // Fallback: Send to CS
        const csNumbers = await db.rawQueryAll<{ phone_number: string }>(
          `SELECT phone_number FROM whatsapp_cs_numbers 
           WHERE is_active = true
           ORDER BY id ASC`
        );

        for (const cs of csNumbers) {
          try {
            await sendWhatsAppNotification(
              cs.phone_number, 
              from, 
              subject, 
              `Failed to send to user!\nTransaction #${transaction.id}\nUser: ${transaction.username || transaction.user_id}\nPhone: ${user.phone_number}\nVoucher Code: ${voucherCode}\n\n${body}`
            );
          } catch {
            // Ignore CS notification errors
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
