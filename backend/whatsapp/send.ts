import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import db from "../db";
import { secret } from "encore.dev/config";

const fonnteToken = secret("FonnteToken");

export interface SendWhatsAppRequest {
  target: string;
  message: string;
  delay?: string;
  countryCode?: string;
}

export interface SendWhatsAppResponse {
  success: boolean;
  detail: string;
  id?: string[];
  target?: string[];
}

export const sendWhatsApp = api<SendWhatsAppRequest, SendWhatsAppResponse>(
  { expose: true, method: "POST", path: "/whatsapp/send", auth: true },
  async ({ target, message, delay, countryCode = "62" }) => {
    const auth = getAuthData()!;
    
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Only admin can send WhatsApp messages");
    }

    const token = fonnteToken();
    
    if (!token || token === "") {
      throw APIError.failedPrecondition("Fonnte Token belum dikonfigurasi. Silakan isi FonnteToken di Settings.");
    }

    try {
      const formData = new URLSearchParams();
      formData.append('target', target);
      formData.append('message', message);
      formData.append('countryCode', countryCode);
      
      if (delay) {
        formData.append('delay', delay);
      }

      const response = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const data = await response.json();

      console.log("Fonnte API Response:", data);

      const responseData = data as any;
      if (!response.ok || responseData.status === false) {
        throw new Error(responseData.reason || "Failed to send WhatsApp message");
      }

      return {
        success: true,
        detail: responseData.detail || "Message sent successfully",
        id: responseData.id,
        target: responseData.target,
      };
    } catch (err: any) {
      console.error("WhatsApp send error:", err);
      throw APIError.internal("Failed to send WhatsApp message: " + err.message, err);
    }
  }
);

export interface TestWhatsAppRequest {
  phoneNumber: string;
}

export interface TestWhatsAppResponse {
  success: boolean;
  message: string;
}

export const testWhatsApp = api<TestWhatsAppRequest, TestWhatsAppResponse>(
  { expose: true, method: "POST", path: "/whatsapp/test", auth: true },
  async ({ phoneNumber }) => {
    const auth = getAuthData()!;
    
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Only admin can test WhatsApp");
    }

    try {
      const result = await sendWhatsApp({
        target: phoneNumber,
        message: "🎉 *Test WhatsApp API Berhasil!*\n\nPesan ini dikirim dari TopAsli Admin Dashboard.\n\nKoneksi Fonnte WhatsApp API sudah aktif dan berfungsi dengan baik! ✅",
        countryCode: "62",
      });

      return {
        success: true,
        message: `Test message sent successfully to ${phoneNumber}`,
      };
    } catch (err: any) {
      throw err;
    }
  }
);
