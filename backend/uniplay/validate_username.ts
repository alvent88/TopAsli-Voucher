import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";

export interface ValidateUsernameRequest {
  game: string;
  userId: string;
  serverId?: string;
}

export interface ValidateUsernameResponse {
  success: boolean;
  game?: string;
  id?: string;
  server?: string;
  name?: string;
  message?: string;
}

const GAME_ENDPOINTS: Record<string, { path: string; requiresServer: boolean }> = {
  "mobile-legends": { path: "ml", requiresServer: true },
  "free-fire": { path: "ff", requiresServer: false },
  "genshin-impact": { path: "gi", requiresServer: false },
  "valorant": { path: "valo", requiresServer: false },
  "call-of-duty-mobile": { path: "codm", requiresServer: false },
  "arena-of-valor": { path: "aov", requiresServer: false },
  "pubg-mobile": { path: "pubgm", requiresServer: false },
  "honkai-star-rail": { path: "hsr", requiresServer: false },
  "zenless-zone-zero": { path: "zzz", requiresServer: false },
  "point-blank": { path: "pb", requiresServer: false },
  "lifeafter": { path: "la", requiresServer: true },
  "punishing-gray-raven": { path: "pgr", requiresServer: true },
};

export const validateUsername = api<ValidateUsernameRequest, ValidateUsernameResponse>(
  { expose: true, method: "POST", path: "/uniplay/validate-username", auth: true },
  async (req: ValidateUsernameRequest) => {
    const auth = getAuthData()!;
    
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Only admin can validate username");
    }

    const gameConfig = GAME_ENDPOINTS[req.game];
    if (!gameConfig) {
      throw APIError.invalidArgument(`Game "${req.game}" not supported. Supported games: ${Object.keys(GAME_ENDPOINTS).join(", ")}`);
    }

    if (gameConfig.requiresServer && !req.serverId) {
      throw APIError.invalidArgument(`Game "${req.game}" requires serverId parameter`);
    }

    try {
      console.log("=== Validating Username ===");
      console.log("Game:", req.game);
      console.log("User ID:", req.userId);
      console.log("Server ID:", req.serverId);

      const baseUrl = "https://api.isan.eu.org/nickname";
      const endpoint = `${baseUrl}/${gameConfig.path}`;

      const requestBody: any = {
        id: req.userId,
      };

      if (gameConfig.requiresServer && req.serverId) {
        requestBody.server = req.serverId;
      }

      console.log("Request URL:", endpoint);
      console.log("Request body:", JSON.stringify(requestBody));

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const responseText = await response.text();
      console.log("Response status:", response.status);
      console.log("Response body:", responseText);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }

      let data: ValidateUsernameResponse;
      try {
        data = JSON.parse(responseText);
      } catch (parseErr) {
        throw new Error(`Invalid JSON response: ${responseText}`);
      }

      console.log("✅ Validation result:", JSON.stringify(data, null, 2));

      return data;
    } catch (err: any) {
      console.error("❌ Validation failed:", err);
      
      return {
        success: false,
        message: err.message || String(err),
      };
    }
  }
);
