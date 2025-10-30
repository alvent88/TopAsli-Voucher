import { api } from "encore.dev/api";
import db from "../db";

// Email webhook payload structure
export interface EmailWebhookRequest {
  from: string;
  to: string;
  subject: string;
  body_plain?: string;
  body_html?: string;
  timestamp?: string;
  // Additional fields from email forwarding services
  headers?: Record<string, string>;
  attachments?: Array<{
    filename: string;
    content_type: string;
    size: number;
  }>;
}

export interface EmailWebhookResponse {
  success: boolean;
  message: string;
  voucherCode?: string;
  transactionId?: number;
}

// Extract voucher code from email body
function extractVoucherCode(body: string): string | null {
  console.log("=== Extracting Voucher Code ===");
  console.log("Body preview:", body.substring(0, 500));
  
  // Common patterns for voucher codes
  const patterns = [
    /voucher code[:\s]+([A-Z0-9\-]{8,})/i,
    /kode voucher[:\s]+([A-Z0-9\-]{8,})/i,
    /code[:\s]+([A-Z0-9\-]{8,})/i,
    /pin[:\s]+([A-Z0-9\-]{8,})/i,
    /serial[:\s]+([A-Z0-9\-]{8,})/i,
    /redeem code[:\s]+([A-Z0-9\-]{8,})/i,
  ];
  
  for (const pattern of patterns) {
    const match = body.match(pattern);
    if (match && match[1]) {
      console.log("✅ Voucher code found:", match[1]);
      return match[1].trim();
    }
  }
  
  console.log("❌ No voucher code found");
  return null;
}

// Find pending transaction for this email
async function findPendingTransaction(email: string, productName?: string): Promise<any> {
  console.log("=== Finding Pending Transaction ===");
  console.log("Looking for transaction with email:", email);
  
  // Query pending voucher transactions ordered by newest first
  const result = await db.query<{
    id: number;
    user_id: string;
    product_id: number;
    package_id: number;
    price: number;
    status: string;
    phone: string;
    product_name: string;
    package_name: string;
  }>`
    SELECT 
      t.id,
      t.user_id,
      t.product_id,
      t.package_id,
      t.price,
      t.status,
      u.phone,
      p.name as product_name,
      pkg.name as package_name
    FROM transactions t
    INNER JOIN users u ON t.user_id = u.clerk_user_id
    INNER JOIN products p ON t.product_id = p.id
    INNER JOIN packages pkg ON t.package_id = pkg.id
    WHERE u.email = ${email}
      AND t.status = 'pending'
      AND p.category = 'Voucher'
    ORDER BY t.created_at DESC
    LIMIT 1
  `;
  
  if (result.length > 0) {
    console.log("✅ Found pending transaction:", result[0].id);
    return result[0];
  }
  
  console.log("❌ No pending transaction found");
  return null;
}

// Update transaction with voucher code
async function updateTransactionWithVoucher(transactionId: number, voucherCode: string): Promise<void> {
  await db.exec`
    UPDATE transactions
    SET 
      status = 'success',
      game_id = ${voucherCode},
      updated_at = NOW()
    WHERE id = ${transactionId}
  `;
  
  console.log("✅ Transaction updated with voucher code");
}

// Send voucher to customer via WhatsApp
async function sendVoucherToWhatsApp(phone: string, voucherCode: string, productName: string, packageName: string): Promise<void> {
  console.log("=== Sending Voucher to WhatsApp ===");
  console.log("Phone:", phone);
  console.log("Voucher Code:", voucherCode);
  
  // Get WhatsApp config from database
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
  
  // Format message
  const message = `🎉 *Voucher Berhasil Diterima!*

Terima kasih atas pembelian Anda!

📦 *Produk:* ${productName}
💎 *Paket:* ${packageName}

🎫 *KODE VOUCHER:*
\`${voucherCode}\`

Silakan gunakan kode voucher di atas untuk redeem.

_Simpan kode ini dengan baik. Jangan bagikan ke orang lain._

Terima kasih telah berbelanja! 🙏`;
  
  // Send via Fonnte
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
  
  const result = await response.json();
  console.log("WhatsApp send result:", result);
  
  if (!response.ok || result.status === false) {
    throw new Error(`Failed to send WhatsApp: ${JSON.stringify(result)}`);
  }
  
  console.log("✅ Voucher sent to WhatsApp");
}

export const receiveEmail = api<EmailWebhookRequest, EmailWebhookResponse>(
  { expose: true, method: "POST", path: "/email/webhook", auth: false },
  async (req: EmailWebhookRequest) => {
    console.log("=== Email Webhook Received ===");
    console.log("From:", req.from);
    console.log("To:", req.to);
    console.log("Subject:", req.subject);
    
    try {
      // Check if email is from UniPlay
      const fromLower = req.from.toLowerCase();
      if (!fromLower.includes("uniplay.id")) {
        console.log("⚠️ Email not from UniPlay, ignoring");
        return {
          success: true,
          message: "Email ignored - not from UniPlay",
        };
      }
      
      // Extract email body
      const body = req.body_plain || req.body_html || "";
      
      if (!body) {
        throw new Error("Email body is empty");
      }
      
      // Extract voucher code
      const voucherCode = extractVoucherCode(body);
      
      if (!voucherCode) {
        console.log("⚠️ No voucher code found in email");
        return {
          success: true,
          message: "No voucher code found in email",
        };
      }
      
      // Find pending transaction
      // Extract recipient email from "to" field
      const recipientEmail = req.to.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/)?.[1];
      
      if (!recipientEmail) {
        throw new Error("Could not extract recipient email");
      }
      
      const transaction = await findPendingTransaction(recipientEmail);
      
      if (!transaction) {
        console.log("⚠️ No pending transaction found for this email");
        return {
          success: true,
          message: "No pending transaction found",
        };
      }
      
      // Update transaction with voucher code
      await updateTransactionWithVoucher(transaction.id, voucherCode);
      
      // Send voucher to customer via WhatsApp
      await sendVoucherToWhatsApp(
        transaction.phone,
        voucherCode,
        transaction.product_name,
        transaction.package_name
      );
      
      console.log("✅ Voucher processed successfully");
      
      return {
        success: true,
        message: "Voucher processed and sent to customer",
        voucherCode,
        transactionId: transaction.id,
      };
      
    } catch (error: any) {
      console.error("❌ Email webhook error:", error);
      
      // Don't throw error to avoid retries from email service
      return {
        success: false,
        message: error.message || "Failed to process email",
      };
    }
  }
);
