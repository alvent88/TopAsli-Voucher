import { api } from "encore.dev/api";
import db from "../db";
import { messageTopic } from "../notification/events";

export interface CreateMessageRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface CreateMessageResponse {
  success: boolean;
  id: number;
}

export const create = api<CreateMessageRequest, CreateMessageResponse>(
  { expose: true, method: "POST", path: "/messages" },
  async ({ name, email, subject, message }) => {
    const row = await db.queryRow<{ id: number }>`
      INSERT INTO messages (name, email, subject, message)
      VALUES (${name}, ${email}, ${subject}, ${message})
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
