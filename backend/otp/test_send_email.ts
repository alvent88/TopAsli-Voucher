import { api } from "encore.dev/api";

export interface TestResponse {
  message: string;
}

export const testEmailOTPEndpoint = api<{}, TestResponse>(
  { expose: true, method: "GET", path: "/otp/test-email-endpoint", auth: false },
  async () => {
    return {
      message: "Email OTP endpoint is accessible!",
    };
  }
);
