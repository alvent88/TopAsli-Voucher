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
      // 1. Check if CS numbers exist
      const csNumbers = await db.query<{ phone_number: string; is_active: boolean }>`
        SELECT phone_number, is_active FROM whatsapp_cs_numbers 
        ORDER BY id ASC
      `;

      console.log(`Found ${csNumbers.length} CS numbers in database`);
      csNumbers.forEach(cs => {
        console.log(`- ${cs.phone_number} (active: ${cs.is_active})`);
      });

      // 2. Check if Fonnte token is set
      const config = await db.queryRow<{ value: string }>`
        SELECT value FROM admin_config WHERE key = 'dashboard_config'
      `;

      let fonnteTokenSet = false;
      if (config) {
        const dashboardConfig = JSON.parse(config.value);
        fonnteTokenSet = !!dashboardConfig.whatsapp?.fonnteToken;
        console.log("Fonnte token set:", fonnteTokenSet);
      }

      // 3. Get active CS numbers
      const activeCs = csNumbers.filter(cs => cs.is_active);
      console.log(`Active CS numbers: ${activeCs.length}`);

      return {
        success: true,
        message: "Webhook components check completed",
        csNumbersFound: csNumbers.length,
        csNumbers: activeCs.map(cs => cs.phone_number),
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
