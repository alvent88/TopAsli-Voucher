interface TransactionReceiptData {
  transactionId: string;
  customerName: string;
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

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
};

export const generateTransactionReceiptHTML = (data: TransactionReceiptData): string => {
  const usernameRow = data.username ? `
    <tr>
      <td style="padding: 8px 0; color: #666;">Username:</td>
      <td style="padding: 8px 0; font-weight: 600; text-align: right;">${data.username}</td>
    </tr>
  ` : '';

  const gameIdRow = data.gameId ? `
    <tr>
      <td style="padding: 8px 0; color: #666;">Game ID / Zone ID:</td>
      <td style="padding: 8px 0; font-weight: 600; text-align: right;">${data.gameId}</td>
    </tr>
  ` : '';

  const uniplayRow = data.uniplayOrderId ? `
    <tr>
      <td style="padding: 8px 0; color: #666;">UniPlay Order ID:</td>
      <td style="padding: 8px 0; font-weight: 600; text-align: right;">${data.uniplayOrderId}</td>
    </tr>
  ` : '';

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Transaction Receipt - TopAsli</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">TopAsli</h1>
      <p style="margin: 10px 0 0; color: #ffffff; font-size: 14px; opacity: 0.9;">Gaming Top-Up Platform</p>
    </div>

    <div style="padding: 40px 30px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="display: inline-block; background-color: #10b981; color: white; padding: 8px 20px; border-radius: 20px; font-size: 14px; font-weight: 600;">
          ✅ PURCHASE SUCCESSFUL
        </div>
      </div>

      <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 20px; font-weight: 600;">Hello ${data.customerName},</h2>
      <p style="margin: 0 0 30px; color: #6b7280; font-size: 15px; line-height: 1.6;">
        Your purchase has been successfully processed! Your items will be delivered to your game account within 5 minutes.
      </p>

      <div style="background-color: #f9fafb; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
        <h3 style="margin: 0 0 15px; color: #1f2937; font-size: 16px; font-weight: 600;">Transaction Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666;">Transaction ID:</td>
            <td style="padding: 8px 0; font-weight: 600; text-align: right; font-family: monospace;">${data.transactionId}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Date:</td>
            <td style="padding: 8px 0; font-weight: 600; text-align: right;">${formatDate(data.createdAt)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Status:</td>
            <td style="padding: 8px 0; font-weight: 600; text-align: right;">
              <span style="color: #10b981;">${data.status.toUpperCase()}</span>
            </td>
          </tr>
        </table>
      </div>

      <div style="background-color: #f9fafb; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
        <h3 style="margin: 0 0 15px; color: #1f2937; font-size: 16px; font-weight: 600;">🎮 Game Account</h3>
        <table style="width: 100%; border-collapse: collapse;">
          ${usernameRow}
          <tr>
            <td style="padding: 8px 0; color: #666;">User ID:</td>
            <td style="padding: 8px 0; font-weight: 600; text-align: right; font-family: monospace;">${data.userId}</td>
          </tr>
          ${gameIdRow}
          ${uniplayRow}
        </table>
      </div>

      <div style="background-color: #f9fafb; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
        <h3 style="margin: 0 0 15px; color: #1f2937; font-size: 16px; font-weight: 600;">📦 Purchase Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666;">Product:</td>
            <td style="padding: 8px 0; font-weight: 600; text-align: right;">${data.productName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Package:</td>
            <td style="padding: 8px 0; font-weight: 600; text-align: right;">${data.packageName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Amount:</td>
            <td style="padding: 8px 0; font-weight: 600; text-align: right;">${data.amount} ${data.unit}</td>
          </tr>
        </table>
      </div>

      <div style="background-color: #f9fafb; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
        <h3 style="margin: 0 0 15px; color: #1f2937; font-size: 16px; font-weight: 600;">💰 Payment Summary</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666;">Subtotal:</td>
            <td style="padding: 8px 0; font-weight: 600; text-align: right;">${formatCurrency(data.price)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Service Fee:</td>
            <td style="padding: 8px 0; font-weight: 600; text-align: right;">${formatCurrency(data.fee)}</td>
          </tr>
          <tr style="border-top: 2px solid #e5e7eb;">
            <td style="padding: 12px 0 8px; color: #1f2937; font-weight: 600; font-size: 16px;">Total:</td>
            <td style="padding: 12px 0 8px; font-weight: 700; font-size: 18px; text-align: right; color: #667eea;">${formatCurrency(data.total)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Payment Method:</td>
            <td style="padding: 8px 0; font-weight: 600; text-align: right;">${data.paymentMethod}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Remaining Balance:</td>
            <td style="padding: 8px 0; font-weight: 600; text-align: right; color: #10b981;">${formatCurrency(data.newBalance)}</td>
          </tr>
        </table>
      </div>

      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; padding: 15px; margin-bottom: 30px;">
        <p style="margin: 0; color: #92400e; font-size: 14px;">
          ⚠️ <strong>Important:</strong> Items will be delivered to your game account within 5 minutes. Please check your in-game inbox.
        </p>
      </div>

      <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">
          Thank you for choosing TopAsli! 🙏
        </p>
        <p style="margin: 0; color: #9ca3af; font-size: 12px;">
          Need help? Contact us at <a href="mailto:support@topasli.com" style="color: #667eea; text-decoration: none;">support@topasli.com</a>
        </p>
      </div>
    </div>

    <div style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0; color: #9ca3af; font-size: 12px;">
        © 2025 TopAsli. All rights reserved.<br>
        This is an automated email. Please do not reply to this message.
      </p>
    </div>
  </div>
</body>
</html>
  `;
};

export const generateTransactionReceiptText = (data: TransactionReceiptData): string => {
  const usernameInfo = data.username ? `Username: ${data.username}\n` : '';
  const gameIdInfo = data.gameId ? `Game ID / Zone ID: ${data.gameId}\n` : '';
  const uniplayInfo = data.uniplayOrderId ? `UniPlay Order ID: ${data.uniplayOrderId}\n` : '';

  return `
TopAsli - Gaming Top-Up Platform
================================

✅ PURCHASE SUCCESSFUL

Hello ${data.customerName},

Your purchase has been successfully processed! Your items will be delivered to your game account within 5 minutes.

TRANSACTION DETAILS
-------------------
Transaction ID: ${data.transactionId}
Date: ${formatDate(data.createdAt)}
Status: ${data.status.toUpperCase()}

GAME ACCOUNT
------------
${usernameInfo}User ID: ${data.userId}
${gameIdInfo}${uniplayInfo}

PURCHASE DETAILS
----------------
Product: ${data.productName}
Package: ${data.packageName}
Amount: ${data.amount} ${data.unit}

PAYMENT SUMMARY
---------------
Subtotal: ${formatCurrency(data.price)}
Service Fee: ${formatCurrency(data.fee)}
-------------------
Total: ${formatCurrency(data.total)}
Payment Method: ${data.paymentMethod}
Remaining Balance: ${formatCurrency(data.newBalance)}

⚠️ IMPORTANT: Items will be delivered to your game account within 5 minutes. Please check your in-game inbox.

Thank you for choosing TopAsli! 🙏

Need help? Contact us at support@topasli.com

---
© 2025 TopAsli. All rights reserved.
This is an automated email. Please do not reply to this message.
  `.trim();
};
