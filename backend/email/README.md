# Email Service - Resend Integration

This service handles automated email sending for transaction receipts using the Resend API.

## Features

- **Automated Transaction Receipts**: Automatically sends email receipts after successful purchases
- **PDF Invoice Generation**: Generates professional PDF invoices attached to each email
- **HTML Email Templates**: Beautiful, responsive email templates with transaction details
- **Plain Text Fallback**: Includes plain text version for email clients that don't support HTML

## Setup

### 1. Get Resend API Key

1. Sign up for a Resend account at https://resend.com
2. Create a new API key in your Resend dashboard
3. Copy the API key (starts with `re_`)

### 2. Configure the API Key in Leap

Open **Settings** in the Leap sidebar and add:

- **Secret Name**: `ResendApiKey`
- **Secret Value**: Your Resend API key (e.g., `re_abc123...`)

### 3. Configure Email Sender Domain (Optional)

By default, emails are sent from `noreply@topasli.com`. To use your own domain:

1. Add and verify your domain in Resend dashboard
2. Update the `from` field in `/backend/email/send_transaction_email.ts`:

```typescript
from: "Your App <noreply@yourdomain.com>",
```

## How It Works

### Automatic Email Sending

Emails are automatically sent when:

1. **Direct Purchase** (old flow): Email sent immediately after transaction creation
2. **Inquiry + Confirm** (new flow): Email sent after payment confirmation

### Email Contents

Each email includes:

- **Transaction Details**: ID, date, status
- **Game Account Info**: User ID, Game ID, username (if provided)
- **Purchase Details**: Product, package, amount
- **Payment Summary**: Subtotal, fees, total, remaining balance
- **PDF Invoice**: Professional invoice attached as PDF

### Files Overview

- `client.ts` - Resend client initialization
- `templates.ts` - HTML and text email templates
- `generate_invoice_pdf.ts` - PDF invoice generation using PDFKit
- `send_transaction_email.ts` - Core email sending function
- `send_receipt.ts` - Manual receipt sending API endpoint

## Usage

### Automatic (Integrated)

Emails are sent automatically when transactions are created or confirmed. No manual action needed.

### Manual (API Endpoint)

You can manually send a receipt for any transaction:

```typescript
POST /email/send-receipt
{
  "transactionId": "TRX1234567890",
  "recipientEmail": "customer@example.com",
  "recipientName": "Customer Name"
}
```

## Testing

### Test Email Sending

1. Make a test purchase through your application
2. Check the backend logs for email sending status:
   - `✅ Email receipt sent successfully!` - Email sent
   - `❌ Failed to send email` - Email failed (check error details)

### Verify Email Delivery

1. Check your email inbox for the receipt
2. Verify the PDF attachment is included
3. Check Resend dashboard for delivery logs

## Customization

### Modify Email Template

Edit `/backend/email/templates.ts` to customize:
- Email styling and colors
- Email content and wording
- Transaction information displayed

### Modify PDF Invoice

Edit `/backend/email/generate_invoice_pdf.ts` to customize:
- Invoice layout and design
- Company information
- Invoice sections and formatting

### Change Email Subject

Update the subject in `/backend/email/send_transaction_email.ts`:

```typescript
subject: `✅ Your Custom Subject - ${data.transactionId}`,
```

## Troubleshooting

### Email Not Sending

1. **Check API Key**: Verify `ResendApiKey` is set in Settings
2. **Check Logs**: Look for error messages in backend logs
3. **Verify Email**: Ensure customer has a valid email address
4. **Check Resend Dashboard**: Verify API key is active and domain is verified

### Email in Spam

1. Verify your domain in Resend
2. Set up SPF, DKIM, and DMARC records
3. Use a verified domain instead of default

### PDF Not Generating

1. Check PDFKit is installed (automatically installed in Leap)
2. Verify transaction data is complete
3. Check backend logs for PDF generation errors

## Dependencies

The following packages are automatically installed:

- `resend` - Resend API client
- `pdfkit` - PDF generation library
- `@types/pdfkit` - TypeScript types for PDFKit

## Support

For issues with:
- **Resend API**: https://resend.com/docs
- **Email Delivery**: Check Resend dashboard logs
- **PDF Generation**: Check backend logs for errors
