import { api, APIError } from "encore.dev/api";
import db from "../db";
import { validateUsernameWithSandrocods } from "./sandrocods_api";

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
  
  if (lowerName.includes("mobile legends")) {
    return { endpoint: "/ml", needsServer: true };
  }
  
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
  if (lowerName.includes("magic chess")) {
    return { endpoint: "/mcgg", needsServer: true };
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

      const product = await db.queryRow<{ name: string; slug: string }>`
        SELECT name, slug FROM products WHERE id = ${req.productId}
      `;

      if (!product) {
        throw APIError.notFound("Product not found");
      }

      console.log("Product name:", product.name);
      console.log("Product slug:", product.slug);

      const excludedGames = ["arena-of-valor", "free-fire", "mobile-legends"];
      
      if (!excludedGames.includes(product.slug)) {
        console.log("🎮 Using Sandrocods API for validation");
        
        const result = await validateUsernameWithSandrocods(
          product.slug,
          req.userId,
          req.serverId || ""
        );
        
        if (result.success && result.username) {
          return {
            success: true,
            valid: true,
            username: result.username,
            game: product.name,
            message: "Username found",
          };
        } else if (result.message === "Validation not available for this game") {
          console.log("⚠️ Game not supported by Sandrocods API, trying isan.eu.org");
        } else {
          return {
            success: true,
            valid: false,
            message: result.message || "User ID not found",
          };
        }
      }

      const gameConfig = getGameEndpoint(product.name);
      
      if (!gameConfig) {
        console.log("⚠️ Product not supported by validation API");
        return {
          success: true,
          valid: false,
          message: "Validation not available for this game",
        };
      }

      console.log("✅ Product supported - Validation endpoint:", gameConfig.endpoint);
      console.log("Needs server:", gameConfig.needsServer);

      if (gameConfig.needsServer && !req.serverId) {
        return {
          success: false,
          valid: false,
          message: "Server ID is required for this game",
        };
      }

      let validationUrl = `${VALIDATION_API_BASE}${gameConfig.endpoint}?id=${req.userId}`;
      
      if (gameConfig.needsServer && req.serverId) {
        validationUrl += `&server=${req.serverId}`;
      }

      console.log("Validation URL:", validationUrl);

      const response = await fetch(validationUrl);
      const responseText = await response.text();
      
      console.log("Validation API response status:", response.status);
      console.log("Validation API response:", responseText);

      if (!response.ok) {
        console.error("Validation API error - Status:", response.status);
        return {
          success: true,
          valid: false,
          message: "Username not found",
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
          message: "Username not found",
        };
      }

      console.log("Parsed validation response:", data);
      console.log("data.success:", data.success);
      console.log("data.name:", data.name);
      console.log("data.message:", data.message);

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
        console.log("❌ Username validation FAILED - Username not found");
        return {
          success: true,
          valid: false,
          message: "Username not found",
        };
      }

    } catch (err) {
      console.error("Username validation error:", err);
      
      return {
        success: false,
        valid: true,
        message: "Validation service error - proceeding without validation",
      };
    }
  }
);
