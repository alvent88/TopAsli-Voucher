import { api } from "encore.dev/api";

export interface TestWebhookRequest {
  from: string;
  subject: string;
  body: string;
}

export interface TestWebhookResponse {
  success: boolean;
  message: string;
  extractedCode?: string;
}

export const testWebhook = api<TestWebhookRequest, TestWebhookResponse>(
  { expose: true, method: "POST", path: "/email/test-webhook", auth: true },
  async (req: TestWebhookRequest) => {
    console.log("=== Testing Email Webhook ===");
    console.log("From:", req.from);
    console.log("Subject:", req.subject);
    console.log("Body preview:", req.body.substring(0, 200));
    
    // Test voucher code extraction
    const patterns = [
      /voucher code[:\s]+([A-Z0-9\-]{8,})/i,
      /kode voucher[:\s]+([A-Z0-9\-]{8,})/i,
      /code[:\s]+([A-Z0-9\-]{8,})/i,
      /pin[:\s]+([A-Z0-9\-]{8,})/i,
      /serial[:\s]+([A-Z0-9\-]{8,})/i,
      /redeem code[:\s]+([A-Z0-9\-]{8,})/i,
    ];
    
    let extractedCode: string | undefined;
    
    for (const pattern of patterns) {
      const match = req.body.match(pattern);
      if (match && match[1]) {
        extractedCode = match[1].trim();
        console.log("✅ Voucher code found:", extractedCode);
        break;
      }
    }
    
    if (!extractedCode) {
      console.log("❌ No voucher code found");
      return {
        success: false,
        message: "No voucher code pattern matched",
      };
    }
    
    return {
      success: true,
      message: "Voucher code extracted successfully",
      extractedCode,
    };
  }
);
