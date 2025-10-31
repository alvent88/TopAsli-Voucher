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
      // 1. Get all CS numbers
      const allCsNumbers = await db.query<{ phone_number: string; is_active: boolean }>`
        SELECT phone_number, is_active FROM whatsapp_cs_numbers 
        ORDER BY id ASC
      `;

      console.log(`Found ${allCsNumbers.length} CS numbers in database`);
      
      // 2. Get only ACTIVE CS numbers with WHERE clause
      const activeCsNumbers = await db.query<{ phone_number: string }>`
        SELECT phone_number FROM whatsapp_cs_numbers 
        WHERE is_active = true
        ORDER BY id ASC
      `;

      console.log(`Active CS numbers: ${activeCsNumbers.length}`);
      for (const cs of activeCsNumbers) {
        console.log(`- ${cs.phone_number}`);
      }

      // 3. Check if Fonnte token is set
      const config = await db.queryRow<{ value: string }>`
        SELECT value FROM admin_config WHERE key = 'dashboard_config'
      `;

      let fonnteTokenSet = false;
      if (config) {
        const dashboardConfig = JSON.parse(config.value);
        fonnteTokenSet = !!dashboardConfig.whatsapp?.fonnteToken;
        console.log("Fonnte token set:", fonnteTokenSet);
      }

      const activePhones: string[] = [];
      for (const cs of activeCsNumbers) {
        activePhones.push(cs.phone_number);
      }

      return {
        success: true,
        message: "Webhook components check completed",
        csNumbersFound: allCsNumbers.length,
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
