import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";

export interface TimeCheckResponse {
  serverTime: string;
  serverTimeISO: string;
  serverYear: number;
  jakartaTime: string;
  jakartaTimeISO: string;
  formattedTimestamp: string;
  forced2024: string;
  forced2025: string;
}

export const checkTime = api<void, TimeCheckResponse>(
  { expose: true, method: "GET", path: "/uniplay/check-time", auth: true },
  async () => {
    const auth = getAuthData()!;
    
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Only admin can check time");
    }

    const now = new Date();
    
    // Jakarta time
    const jakartaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    const jakartaFormatted = jakartaTime.toISOString().slice(0, 19).replace('T', ' ');
    
    // Force 2024
    const forced2024 = new Date(now);
    forced2024.setFullYear(2024);
    const jakarta2024 = new Date(forced2024.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    const formatted2024 = jakarta2024.toISOString().slice(0, 19).replace('T', ' ');
    
    // Force 2025
    const forced2025 = new Date(now);
    forced2025.setFullYear(2025);
    const jakarta2025 = new Date(forced2025.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    const formatted2025 = jakarta2025.toISOString().slice(0, 19).replace('T', ' ');

    return {
      serverTime: now.toString(),
      serverTimeISO: now.toISOString(),
      serverYear: now.getFullYear(),
      jakartaTime: jakartaTime.toString(),
      jakartaTimeISO: jakartaTime.toISOString(),
      formattedTimestamp: jakartaFormatted,
      forced2024: formatted2024,
      forced2025: formatted2025,
    };
  }
);
