import { api, Header } from "encore.dev/api";
import { APIError } from "encore.dev/api";
import db from "../db";

export interface TrackLoginRequest {
  userId: string;
  email?: string;
  phoneNumber?: string;
  loginType: string;
}

export interface TrackLoginResponse {
  success: boolean;
}

export const trackLogin = api<TrackLoginRequest, TrackLoginResponse>(
  { expose: true, method: "POST", path: "/auth/track-login" },
  async ({ userId, email, phoneNumber, loginType }, ipAddress?: Header<"x-forwarded-for">, userAgent?: Header<"user-agent">) => {
    try {
      console.log("=== TRACK LOGIN START ===");
      console.log("User ID:", userId);
      console.log("Email:", email);
      console.log("Phone:", phoneNumber);
      console.log("Login Type:", loginType);
      console.log("IP Address:", ipAddress);
      console.log("User Agent:", userAgent);

      await db.exec`
        INSERT INTO login_history (
          user_id, email, phone_number, login_type, ip_address, user_agent, login_status
        ) VALUES (
          ${userId}, 
          ${email || null}, 
          ${phoneNumber || null}, 
          ${loginType}, 
          ${ipAddress || 'unknown'}, 
          ${userAgent || 'unknown'}, 
          'success'
        )
      `;

      console.log("=== TRACK LOGIN SUCCESS ===");

      return {
        success: true,
      };
    } catch (err: any) {
      console.error("=== TRACK LOGIN ERROR ===");
      console.error("Error:", err);
      
      return {
        success: false,
      };
    }
  }
);
