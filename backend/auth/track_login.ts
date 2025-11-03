import { api, Header } from "encore.dev/api";
import { APIError } from "encore.dev/api";
import db from "../db";

export interface TrackLoginRequest {
  userId: string;
  email?: string;
  phoneNumber?: string;
  loginType: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface TrackLoginResponse {
  success: boolean;
}

export const trackLogin = api<TrackLoginRequest, TrackLoginResponse>(
  { expose: true, method: "POST", path: "/auth/track-login" },
  async ({ userId, email, phoneNumber, loginType, ipAddress: clientIpAddress, userAgent: clientUserAgent }, serverIpAddress?: Header<"x-forwarded-for">, serverUserAgent?: Header<"user-agent">) => {
    try {
      console.log("=== TRACK LOGIN START ===");
      console.log("User ID:", userId);
      console.log("Email:", email);
      console.log("Phone:", phoneNumber);
      console.log("Login Type:", loginType);
      console.log("Client IP Address:", clientIpAddress);
      console.log("Server IP Address:", serverIpAddress);
      console.log("Client User Agent:", clientUserAgent);
      console.log("Server User Agent:", serverUserAgent);

      const finalIpAddress = clientIpAddress || serverIpAddress || 'unknown';
      const finalUserAgent = clientUserAgent || serverUserAgent || 'unknown';

      await db.exec`
        INSERT INTO login_history (
          user_id, email, phone_number, login_type, ip_address, user_agent, login_status
        ) VALUES (
          ${userId}, 
          ${email || null}, 
          ${phoneNumber || null}, 
          ${loginType}, 
          ${finalIpAddress}, 
          ${finalUserAgent}, 
          'success'
        )
      `;

      console.log("=== TRACK LOGIN SUCCESS ===");
      console.log("Final IP Address saved:", finalIpAddress);

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
