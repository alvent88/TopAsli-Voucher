import { Resend } from "resend";
import { secret } from "encore.dev/config";

const resendApiKey = secret("ResendApiKey");

let resendClient: Resend | null = null;

export const getResendClient = (): Resend => {
  if (!resendClient) {
    resendClient = new Resend(resendApiKey());
  }
  return resendClient;
};
