import { Resend } from "resend";
import { secret } from "encore.dev/config";

const resendApiKey = secret("ResendApiKey");

let resendClient: Resend | null = null;

export const getResendClient = (): Resend | null => {
  try {
    const apiKey = resendApiKey();
    
    if (!apiKey || apiKey.trim() === "") {
      console.warn("⚠️ ResendApiKey not configured - Email functionality disabled");
      return null;
    }
    
    if (!resendClient) {
      resendClient = new Resend(apiKey);
    }
    return resendClient;
  } catch (error) {
    console.warn("⚠️ Failed to initialize Resend client:", error);
    return null;
  }
};

export const isResendConfigured = (): boolean => {
  try {
    const apiKey = resendApiKey();
    return !!(apiKey && apiKey.trim() !== "");
  } catch {
    return false;
  }
};
