import { api, APIError } from "encore.dev/api";
import db from "../db";

export interface ValidateUsernameRequest {
  productId: number;
  userId: string;
  serverId?: string;
}

export interface ValidateUsernameResponse {
  success: boolean;
  valid: boolean;
  username?: string;
  message?: string;
  game?: string;
}

const VALIDATION_API_BASE = "https://api.isan.eu.org/nickname";

// Mapping product name to validation endpoint
const GAME_ENDPOINTS: Record<string, { endpoint: string; needsServer: boolean }> = {
  "Mobile Legends: Bang Bang": { endpoint: "/ml", needsServer: true },
  "Mobile Legends: Bang Bang ID": { endpoint: "/ml", needsServer: true },
  "Free Fire": { endpoint: "/ff", needsServer: false },
  "PUBG Mobile": { endpoint: "/pubgm", needsServer: false },
  "Call of Duty Mobile": { endpoint: "/codm", needsServer: false },
  "Arena of Valor": { endpoint: "/aov", needsServer: false },
  "Genshin Impact": { endpoint: "/gi", needsServer: false },
  "Honkai: Star Rail": { endpoint: "/hsr", needsServer: false },
  "Honkai Impact 3rd": { endpoint: "/hi", needsServer: false },
  "Zenless Zone Zero": { endpoint: "/zzz", needsServer: false },
  "Valorant": { endpoint: "/valo", needsServer: false },
  "Point Blank": { endpoint: "/pb", needsServer: false },
};

export const validateUsername = api<ValidateUsernameRequest, ValidateUsernameResponse>(
  { expose: true, method: "POST", path: "/validation/username" },
  async (req: ValidateUsernameRequest) => {
    try {
      console.log("=== Username Validation Request ===");
      console.log("Product ID:", req.productId);
      console.log("User ID:", req.userId);
      console.log("Server ID:", req.serverId);

      // Get product name
      const product = await db.queryRow<{ name: string }>`
        SELECT name FROM products WHERE id = ${req.productId}
      `;

      if (!product) {
        throw APIError.notFound("Product not found");
      }

      console.log("Product name:", product.name);

      // Check if product has validation endpoint
      const gameConfig = GAME_ENDPOINTS[product.name];
      
      if (!gameConfig) {
        // Product not supported by validation API
        return {
          success: true,
          valid: true,
          message: "Validation not available for this game",
        };
      }

      console.log("Validation endpoint:", gameConfig.endpoint);
      console.log("Needs server:", gameConfig.needsServer);

      // Check if server ID is required
      if (gameConfig.needsServer && !req.serverId) {
        return {
          success: false,
          valid: false,
          message: "Server ID is required for this game",
        };
      }

      // Build validation URL
      let validationUrl = `${VALIDATION_API_BASE}${gameConfig.endpoint}?id=${req.userId}`;
      
      if (gameConfig.needsServer && req.serverId) {
        validationUrl += `&server=${req.serverId}`;
      }

      console.log("Validation URL:", validationUrl);

      // Call validation API
      const response = await fetch(validationUrl);
      const responseText = await response.text();
      
      console.log("Validation API response status:", response.status);
      console.log("Validation API response:", responseText);

      if (!response.ok) {
        console.error("Validation API error - Status:", response.status);
        return {
          success: false,
          valid: false,
          message: "Validation service unavailable",
        };
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse validation response:", e);
        return {
          success: false,
          valid: false,
          message: "Invalid response from validation service",
        };
      }

      console.log("Parsed validation response:", data);
      console.log("data.success:", data.success);
      console.log("data.name:", data.name);

      // Check validation result
      if (data.success === true && data.name) {
        console.log("✅ Username validation SUCCESS");
        return {
          success: true,
          valid: true,
          username: data.name,
          game: data.game || product.name,
          message: "Username found",
        };
      } else {
        console.log("❌ Username validation FAILED");
        return {
          success: true,
          valid: false,
          message: data.message || "User ID tidak ditemukan",
        };
      }

    } catch (err) {
      console.error("Username validation error:", err);
      
      // Don't block purchase if validation fails
      return {
        success: false,
        valid: true,
        message: "Validation service error - proceeding without validation",
      };
    }
  }
);
