import { api } from "encore.dev/api";
import db from "../db";

export interface TestWebhookManualResponse {
  success: boolean;
  message: string;
  csNumbersFound: number;
  csNumbers: string[];
  fonnteTokenSet: boolean;
}

export const testWebhookManual = api<{}, TestWebhookManualResponse>(
  { expose: true, method: "POST", path: "/gmail/test-webhook-manual", auth: true },
  async () => {
    console.log("=== Testing Webhook Components ===");

    try {
      // Debug: First check raw query result
      const rawResult = await db.rawQueryAll<{ phone_number: string }>(
        `SELECT phone_number FROM whatsapp_cs_numbers WHERE is_active = true ORDER BY id ASC`
      );
      
      console.log("=== DEBUG RAW RESULT ===");
      console.log("Type:", typeof rawResult);
      console.log("Is Array:", Array.isArray(rawResult));
      console.log("Length:", rawResult.length);
      console.log("Content:", JSON.stringify(rawResult));
      
      const activePhones = rawResult.map(row => row.phone_number);
      console.log("Active phones:", activePhones);

      // Get all CS numbers count
      const allCount = await db.rawQueryAll<{ count: string }>(
        `SELECT COUNT(*) as count FROM whatsapp_cs_numbers`
      );
      const totalCount = parseInt(allCount[0].count);

      // Check if Fonnte token is set
      const config = await db.queryRow<{ value: string }>`
        SELECT value FROM admin_config WHERE key = 'dashboard_config'
      `;

      let fonnteTokenSet = false;
      if (config) {
        const dashboardConfig = JSON.parse(config.value);
        fonnteTokenSet = !!dashboardConfig.whatsapp?.fonnteToken;
        console.log("Fonnte token set:", fonnteTokenSet);
      }

      return {
        success: true,
        message: "Webhook components check completed",
        csNumbersFound: totalCount,
        csNumbers: activePhones,
        fonnteTokenSet,
      };
    } catch (error: any) {
      console.error("❌ Test webhook manual error:", error);
      return {
        success: false,
        message: error.message || "Unknown error",
        csNumbersFound: 0,
        csNumbers: [],
        fonnteTokenSet: false,
      };
    }
  }
);
