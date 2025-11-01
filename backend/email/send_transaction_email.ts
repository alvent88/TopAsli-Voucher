import { getResendClient } from "./client";
import { generateTransactionReceiptHTML, generateTransactionReceiptText } from "./templates";
import { generateInvoicePDF } from "./generate_invoice_pdf";

interface TransactionEmailData {
  transactionId: string;
  recipientEmail: string;
  recipientName: string;
  recipientPhone?: string;
  productName: string;
  packageName: string;
  amount: number;
  unit: string;
  userId: string;
  gameId: string;
  username?: string;
  price: number;
  fee: number;
  total: number;
  paymentMethod: string;
  status: string;
  createdAt: Date;
  newBalance: number;
  uniplayOrderId?: string;
}

export const sendTransactionEmail = async (data: TransactionEmailData): Promise<boolean> => {
  try {
    if (!data.recipientEmail) {
      console.log("⚠️ No email address provided - skipping email");
      return false;
    }

    const resend = getResendClient();
    
    if (!resend) {
      console.log("⚠️ Resend not configured - skipping email");
      console.log("💡 To enable email receipts, configure ResendApiKey in Settings");
      return false;
    }

    const receiptData = {
      transactionId: data.transactionId,
      customerName: data.recipientName,
      productName: data.productName,
      packageName: data.packageName,
      amount: data.amount,
      unit: data.unit,
      userId: data.userId,
      gameId: data.gameId,
      username: data.username,
      price: data.price,
      fee: data.fee,
      total: data.total,
      paymentMethod: data.paymentMethod,
      status: data.status,
      createdAt: data.createdAt,
      newBalance: data.newBalance,
      uniplayOrderId: data.uniplayOrderId,
    };

    const htmlContent = generateTransactionReceiptHTML(receiptData);
    const textContent = generateTransactionReceiptText(receiptData);

    const pdfBuffer = await generateInvoicePDF({
      ...receiptData,
      customerEmail: data.recipientEmail,
      customerPhone: data.recipientPhone || "",
    });

    const { data: emailData, error } = await resend.emails.send({
      from: "Acme <onboarding@resend.dev>",
      to: data.recipientEmail,
      subject: `✅ Transaction Receipt - ${data.transactionId}`,
      html: htmlContent,
      text: textContent,
      attachments: [
        {
          filename: `invoice-${data.transactionId}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    if (error) {
      console.error("❌ Failed to send email:", error);
      return false;
    }

    console.log("✅ Transaction receipt email sent successfully!");
    console.log("📧 Email ID:", emailData?.id);
    console.log("📧 Recipient:", data.recipientEmail);
    console.log("📧 Transaction:", data.transactionId);
    
    return true;
  } catch (err: any) {
    console.error("❌ Error sending transaction email:", err);
    console.error("❌ Error details:", err.message);
    return false;
  }
};
