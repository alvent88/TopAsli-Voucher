import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

export interface CreateMessageRequest {
  name: string;
  subject: string;
  message: string;
}

export interface CreateMessageResponse {
  success: boolean;
  id: number;
}

export const create = api<CreateMessageRequest, CreateMessageResponse>(
  { expose: true, method: "POST", path: "/messages", auth: true },
  async ({ name, subject, message }) => {
    const auth = getAuthData()!;
    const userId = auth.userID;

    let phoneNumber: string | null = null;
    
    try {
      const user = await db.queryRow<{ phone_number: string | null }>`
        SELECT phone_number FROM users WHERE clerk_user_id = ${userId}
      `;
      
      let rawPhone = user?.phone_number || null;
      if (rawPhone) {
        if (!rawPhone.startsWith('62')) {
          if (rawPhone.startsWith('0')) {
            phoneNumber = '62' + rawPhone.substring(1);
          } else if (rawPhone.startsWith('+62')) {
            phoneNumber = rawPhone.substring(1);
          } else {
            phoneNumber = '62' + rawPhone;
          }
        } else {
          phoneNumber = rawPhone;
        }
      }
      console.log("Phone number from database:", phoneNumber);
    } catch (err) {
      console.error("Failed to fetch phone number:", err);
    }

    const rateLimitCheck = await db.queryRow<{ count: number, last_sent: Date | null }>`
      SELECT COUNT(*) as count, MAX(created_at) as last_sent
      FROM messages
      WHERE created_at > NOW() - INTERVAL '1 minute'
        AND name = ${name}
    `;

    if (rateLimitCheck && rateLimitCheck.count >= 1) {
      const lastSent = rateLimitCheck.last_sent;
      if (lastSent) {
        const timeSinceLastMessage = Date.now() - new Date(lastSent).getTime();
        const secondsRemaining = Math.ceil((60000 - timeSinceLastMessage) / 1000);
        throw APIError.resourceExhausted(
          `Anda baru saja mengirim pesan. Silakan tunggu ${secondsRemaining} detik lagi sebelum mengirim pesan baru.`
        );
      }
    }
    const row = await db.queryRow<{ id: number }>`
      INSERT INTO messages (name, subject, message, phone_number)
      VALUES (${name}, ${subject}, ${message}, ${phoneNumber})
      RETURNING id
    `;

    if (!row) {
      throw new Error("Failed to insert message");
    }

    try {
      const csNumbers = await db.rawQueryAll<{ phone_number: string }>(
        `SELECT phone_number FROM whatsapp_cs_numbers WHERE is_active = true`
      );

      if (csNumbers.length === 0) {
        console.log("No active WhatsApp CS numbers found");
        return { success: true, id: row.id };
      }

      const configRow = await db.queryRow<{ value: string }>`
        SELECT value FROM admin_config WHERE key = 'dashboard_config'
      `;

      let token = "";
      if (configRow) {
        const config = JSON.parse(configRow.value);
        token = config.whatsapp?.fonnteToken || "";
      }
      
      if (token && token !== "") {
        const whatsappMessage = `🔔 *Pesan Baru dari Contact Form*\n\n` +
          `👤 *Nama:* ${name}\n` +
          `📱 *WhatsApp:* ${phoneNumber || '-'}\n` +
          `📋 *Subjek:* ${subject}\n\n` +
          `💬 *Pesan:*\n${message}\n\n` +
          `_Pesan ini dikirim otomatis dari website TopAsli_`;

        for (const csNumber of csNumbers) {
          try {
            const response = await fetch("https://api.fonnte.com/send", {
              method: "POST",
              headers: {
                "Authorization": token,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                target: csNumber.phone_number,
                message: whatsappMessage,
              }),
            });

            const result = await response.json();
            console.log(`WhatsApp sent to ${csNumber.phone_number}:`, result);
          } catch (err) {
            console.error(`Failed to send WhatsApp to ${csNumber.phone_number}:`, err);
          }
        }
      }
    } catch (err) {
      console.error("Failed to send WhatsApp notifications:", err);
    }



    return { success: true, id: row.id };
  }
);
