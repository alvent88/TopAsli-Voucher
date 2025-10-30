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
// Map product names to validation endpoints
function getGameEndpoint(productName: string): { endpoint: string; needsServer: boolean } | null {
  const lowerName = productName.toLowerCase();
  
  // Mobile Legends variants
  if (lowerName.includes("mobile legends")) {
    return { endpoint: "/ml", needsServer: true };
  }
  
  // Other games
  if (lowerName.includes("free fire")) {
    return { endpoint: "/ff", needsServer: false };
  }
  if (lowerName.includes("pubg")) {
    return { endpoint: "/pubgm", needsServer: false };
  }
  if (lowerName.includes("call of duty")) {
    return { endpoint: "/codm", needsServer: false };
  }
  if (lowerName.includes("arena of valor")) {
    return { endpoint: "/aov", needsServer: false };
  }
  if (lowerName.includes("genshin")) {
    return { endpoint: "/gi", needsServer: false };
  }
  if (lowerName.includes("honkai") && lowerName.includes("star rail")) {
    return { endpoint: "/hsr", needsServer: false };
  }
  if (lowerName.includes("honkai impact")) {
    return { endpoint: "/hi", needsServer: false };
  }
  if (lowerName.includes("zenless")) {
    return { endpoint: "/zzz", needsServer: false };
  }
  if (lowerName.includes("valorant")) {
    return { endpoint: "/valo", needsServer: false };
  }
  if (lowerName.includes("point blank")) {
    return { endpoint: "/pb", needsServer: false };
  }
  
  return null;
}

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
      const gameConfig = getGameEndpoint(product.name);
      
      if (!gameConfig) {
        console.log("⚠️ Product not supported by validation API");
        // Product not supported by validation API - allow purchase
        return {
          success: true,
          valid: true,
          message: "Validation not available for this game",
        };
      }

      console.log("✅ Product supported - Validation endpoint:", gameConfig.endpoint);
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
          success: true,
          valid: false,
          message: "Username tidak ditemukan. Silakan periksa kembali User ID dan Server ID Anda",
        };
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse validation response:", e);
        return {
          success: true,
          valid: false,
          message: "Username tidak ditemukan. Silakan periksa kembali User ID dan Server ID Anda",
        };
      }

      console.log("Parsed validation response:", data);
      console.log("data.success:", data.success);
      console.log("data.name:", data.name);
      console.log("data.message:", data.message);

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
        // Any other case - treat as invalid
        console.log("❌ Username validation FAILED");
        return {
          success: true,
          valid: false,
          message: "Username tidak ditemukan. Silakan periksa kembali User ID dan Server ID Anda",
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
