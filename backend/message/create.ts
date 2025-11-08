import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import { messageTopic } from "../notification/events";
import { createClerkClient } from "@clerk/backend";
import { secret } from "encore.dev/config";

const clerkSecretKey = secret("ClerkSecretKey");
const clerkClient = createClerkClient({ secretKey: clerkSecretKey() });

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
    const email = auth.email || "";

    let phoneNumber: string | null = null;
    
    try {
      let userFromDb = await db.queryRow<{ clerk_user_id: string, phone_number: string | null }>`
        SELECT clerk_user_id, NULL as phone_number FROM email_registrations WHERE email = ${email}
      `;
      
      if (!userFromDb) {
        userFromDb = await db.queryRow<{ clerk_user_id: string, phone_number: string | null }>`
          SELECT clerk_user_id, phone_number FROM phone_registrations WHERE email = ${email}
        `;
      }
      
      if (userFromDb) {
        if (userFromDb.phone_number) {
          phoneNumber = userFromDb.phone_number;
        } else if (userFromDb.clerk_user_id) {
          const clerkUser = await clerkClient.users.getUser(userFromDb.clerk_user_id);
          phoneNumber = (clerkUser.unsafeMetadata?.phoneNumber as string) || null;
        }
      }
    } catch (err) {
      console.log("Failed to fetch phone number from database/Clerk:", err);
    }

    const rateLimitCheck = await db.queryRow<{ count: number, last_sent: Date | null }>`
      SELECT COUNT(*) as count, MAX(created_at) as last_sent
      FROM messages
      WHERE created_at > NOW() - INTERVAL '1 hour'
        AND (email = ${email} OR name = ${name})
    `;

    if (rateLimitCheck && rateLimitCheck.count >= 3) {
      const lastSent = rateLimitCheck.last_sent;
      if (lastSent) {
        const timeSinceLastMessage = Date.now() - new Date(lastSent).getTime();
        const minutesRemaining = Math.ceil((3600000 - timeSinceLastMessage) / 60000);
        throw APIError.resourceExhausted(
          `Anda telah mencapai batas pengiriman pesan (3 pesan per jam). Silakan coba lagi dalam ${minutesRemaining} menit.`
        );
      }
    }
    const row = await db.queryRow<{ id: number }>`
      INSERT INTO messages (name, email, subject, message, phone_number)
      VALUES (${name}, ${email}, ${subject}, ${message}, ${phoneNumber})
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
          `📧 *Email:* ${email}\n` +
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

    await messageTopic.publish({
      messageId: row.id.toString(),
      name,
      email,
      subject,
      timestamp: new Date(),
    });

    return { success: true, id: row.id };
  }
);
