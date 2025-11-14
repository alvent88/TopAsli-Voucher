import { api } from "encore.dev/api";
import { APIError } from "encore.dev/api";
import db from "../db";

export interface VerifyForgotPasswordRequest {
  phoneNumber: string;
  dateOfBirth: string;
}

export interface VerifyForgotPasswordResponse {
  verified: boolean;
  resetToken: string;
}

export const verifyForgotPassword = api<VerifyForgotPasswordRequest, VerifyForgotPasswordResponse>(
  { expose: true, method: "POST", path: "/auth/forgot-password/verify", auth: false },
  async ({ phoneNumber, dateOfBirth }) => {
    console.log("Verifying forgot password for phone:", phoneNumber);

    const user = await db.queryRow<{ 
      clerk_user_id: string;
      date_of_birth: string | null;
      phone_number: string;
    }>`
      SELECT clerk_user_id, date_of_birth, phone_number
      FROM users
      WHERE phone_number = ${phoneNumber}
    `;

    if (!user) {
      throw APIError.notFound("Nomor telepon tidak terdaftar");
    }

    if (!user.date_of_birth) {
      throw APIError.invalidArgument(
        "Akun Anda belum memiliki tanggal lahir. Silakan hubungi customer service untuk reset password."
      );
    }

    const inputDate = new Date(dateOfBirth);
    const storedDate = new Date(user.date_of_birth);

    if (inputDate.getTime() !== storedDate.getTime()) {
      throw APIError.permissionDenied("Tanggal lahir tidak sesuai");
    }

    const resetToken = Buffer.from(
      JSON.stringify({
        userId: user.clerk_user_id,
        timestamp: Date.now(),
        phoneNumber: phoneNumber,
      })
    ).toString("base64");

    return {
      verified: true,
      resetToken,
    };
  }
);
