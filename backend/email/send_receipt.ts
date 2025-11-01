import { api } from "encore.dev/api";
import { getResendClient } from "./client";
import { generateTransactionReceiptHTML, generateTransactionReceiptText } from "./templates";
import { generateInvoicePDF } from "./generate_invoice_pdf";
import db from "../db";

interface SendReceiptRequest {
  transactionId: string;
  recipientEmail: string;
  recipientName: string;
}

interface SendReceiptResponse {
  success: boolean;
  emailId?: string;
  error?: string;
}

export const sendReceipt = api<SendReceiptRequest, SendReceiptResponse>(
  { expose: true, method: "POST", path: "/email/send-receipt" },
  async ({ transactionId, recipientEmail, recipientName }) => {
    try {
      const resend = getResendClient();
      
      if (!resend) {
        return { 
          success: false, 
          error: "Resend not configured. Please configure ResendApiKey in Settings." 
        };
      }

      const transaction = await db.queryRow<{
        product_id: number;
        package_id: number;
        payment_method_id: number;
        user_id: string;
        game_id: string;
        username: string | null;
        price: number;
        fee: number;
        total: number;
        status: string;
        created_at: Date;
        uniplay_order_id: string | null;
      }>`
        SELECT 
          product_id, package_id, payment_method_id, user_id, game_id, 
          username, price, fee, total, status, created_at, uniplay_order_id
        FROM transactions
        WHERE id = ${transactionId}
      `;

      if (!transaction) {
        return { success: false, error: "Transaction not found" };
      }

      const product = await db.queryRow<{ name: string }>`
        SELECT name FROM products WHERE id = ${transaction.product_id}
      `;

      const pkg = await db.queryRow<{ name: string; amount: number; unit: string }>`
        SELECT name, amount, unit FROM packages WHERE id = ${transaction.package_id}
      `;

      const paymentMethod = await db.queryRow<{ name: string }>`
        SELECT name FROM payment_methods WHERE id = ${transaction.payment_method_id}
      `;

      if (!product || !pkg || !paymentMethod) {
        return { success: false, error: "Transaction details not found" };
      }

      const userBalance = await db.queryRow<{ balance: number }>`
        SELECT balance FROM user_balance WHERE user_id = ${transaction.user_id}
      `;

      const receiptData = {
        transactionId,
        customerName: recipientName,
        productName: product.name,
        packageName: pkg.name,
        amount: pkg.amount,
        unit: pkg.unit,
        userId: transaction.user_id,
        gameId: transaction.game_id,
        username: transaction.username || undefined,
        price: transaction.price,
        fee: transaction.fee,
        total: transaction.total,
        paymentMethod: paymentMethod.name,
        status: transaction.status,
        createdAt: transaction.created_at,
        newBalance: userBalance?.balance || 0,
        uniplayOrderId: transaction.uniplay_order_id || undefined,
      };

      const htmlContent = generateTransactionReceiptHTML(receiptData);
      const textContent = generateTransactionReceiptText(receiptData);

      const pdfBuffer = await generateInvoicePDF({
        ...receiptData,
        customerEmail: recipientEmail,
        customerPhone: "",
      });

      const { data, error } = await resend!.emails.send({
        from: "Acme <onboarding@resend.dev>",
        to: recipientEmail,
        subject: `Transaction Receipt - ${transactionId}`,
        html: htmlContent,
        text: textContent,
        attachments: [
          {
            filename: `invoice-${transactionId}.pdf`,
            content: pdfBuffer,
          },
        ],
      });

      if (error) {
        console.error("Failed to send email:", error);
        return { success: false, error: error.message };
      }

      console.log("✅ Email sent successfully:", data?.id);
      return { success: true, emailId: data?.id };
    } catch (err: any) {
      console.error("Error sending receipt email:", err);
      return { success: false, error: err.message };
    }
  }
);
