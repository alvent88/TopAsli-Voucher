import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";

const GMAIL_ADDRESS = secret("GmailAddress");
const GMAIL_APP_PASSWORD = secret("GmailAppPassword");

interface EmailMessage {
  id: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
}

export interface TestImapResponse {
  success: boolean;
  messageCount: number;
  messages: EmailMessage[];
  error?: string;
}

// Using Gmail API via simple HTTP requests (no OAuth, just app password)
// We'll use Gmail's REST API with Basic Auth
async function fetchEmailsViaGmailAPI(): Promise<EmailMessage[]> {
  const email = GMAIL_ADDRESS();
  const appPassword = GMAIL_APP_PASSWORD();
  
  // Encode credentials for Basic Auth
  const credentials = Buffer.from(`${email}:${appPassword}`).toString('base64');
  
  // Gmail API endpoint (requires OAuth, not Basic Auth)
  // Instead, let's use a workaround: Gmail's Atom feed
  const atomFeedUrl = `https://mail.google.com/mail/feed/atom`;
  
  const response = await fetch(atomFeedUrl, {
    headers: {
      'Authorization': `Basic ${credentials}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Gmail Atom feed error: ${response.status} ${response.statusText}`);
  }

  const xmlText = await response.text();
  console.log("Gmail Atom feed response:", xmlText.substring(0, 500));
  
  // Parse XML to extract emails
  const messages: EmailMessage[] = [];
  
  // Extract entries from XML (simple regex parsing for POC)
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  const entries = xmlText.match(entryRegex) || [];
  
  for (const entry of entries.slice(0, 10)) {
    const title = entry.match(/<title>(.*?)<\/title>/)?.[1] || "";
    const author = entry.match(/<author><name>(.*?)<\/name>/)?.[1] || "";
    const summary = entry.match(/<summary>(.*?)<\/summary>/)?.[1] || "";
    const issued = entry.match(/<issued>(.*?)<\/issued>/)?.[1] || "";
    const id = entry.match(/<id>(.*?)<\/id>/)?.[1] || "";
    
    // Filter for UniPlay emails
    if (author.includes('uniplay') || title.toLowerCase().includes('voucher') || summary.toLowerCase().includes('voucher')) {
      messages.push({
        id: id.substring(id.lastIndexOf('/') + 1),
        subject: title,
        from: author,
        date: issued,
        snippet: summary.substring(0, 200),
      });
    }
  }
  
  return messages;
}

export const testImap = api<{}, TestImapResponse>(
  { expose: true, method: "POST", path: "/email/test-imap", auth: true },
  async () => {
    console.log("=== Testing Gmail Atom Feed ===");

    try {
      const messages = await fetchEmailsViaGmailAPI();

      return {
        success: true,
        messageCount: messages.length,
        messages,
      };
    } catch (error: any) {
      console.error("❌ Gmail error:", error);
      return {
        success: false,
        messageCount: 0,
        messages: [],
        error: error.message || "Unknown error",
      };
    }
  }
);
