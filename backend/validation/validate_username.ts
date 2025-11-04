import { api, APIError } from "encore.dev/api";
import db from "../db";
import { validateGenshinUID } from "./genshin_uid";
import { validateWithCekUsername } from "./cek_username_api";
import { validateWithVelixs } from "./velixs_api";

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
  if (lowerName.includes("honor of kings") || lowerName.includes("afk journey")) {
    return null;
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

      // Only allow validation for specific games
      const allowedGames = ["mobile legends", "magic chess", "free fire", "genshin impact", "valorant", "arena of valor", "honkai impact"];
      const isAllowed = allowedGames.some(game => product.name.toLowerCase().includes(game));
      
      if (!isAllowed) {
        console.log("⚠️ Product not in allowed validation list");
        return {
          success: true,
          valid: false,
          message: "Validation not available for this game",
        };
      }

      const isGenshin = product.slug === "genshin-impact" || 
                        product.name.toLowerCase().includes("genshin");
      
      if (isGenshin) {
        console.log("🎮 Using cek-username API for Genshin validation");
        
        const formatCheck = validateGenshinUID(req.userId);
        
        if (!formatCheck.valid) {
          return {
            success: true,
            valid: false,
            message: formatCheck.message || "Invalid Genshin UID format",
          };
        }
        
        const apiResult = await validateWithCekUsername(
          "genshin-impact",
          req.userId,
          req.serverId || ""
        );
        
        if (apiResult.success && apiResult.username) {
          return {
            success: true,
            valid: true,
            username: apiResult.username,
            message: apiResult.message || "Valid Genshin UID",
            game: product.name,
          };
        } else if (!apiResult.success && apiResult.message) {
          console.log("❌ cek-username API validation failed - UID not found");
          return {
            success: true,
            valid: false,
            message: "UID tidak ditemukan atau tidak valid",
          };
        } else {
          console.log("⚠️ cek-username API error, using format validation fallback");
          return {
            success: true,
            valid: true,
            message: formatCheck.message || "Valid UID format (username not available)",
            game: product.name,
          };
        }
      }

      // Arena of Valor - use isan.eu.org instead of Velixs
      const isAOV = product.name.toLowerCase().includes("arena of valor") || 
                    product.name.toLowerCase().includes("aov");
      
      if (isAOV) {
        console.log("🎮 Using Isan.eu.org API for AOV validation");
        
        const validationUrl = `${VALIDATION_API_BASE}/aov?id=${req.userId}`;
        console.log("Validation URL:", validationUrl);

        try {
          const response = await fetch(validationUrl);
          const responseText = await response.text();
          
          console.log("AOV Validation API response status:", response.status);
          console.log("AOV Validation API response:", responseText);

          if (!response.ok) {
            return {
              success: true,
              valid: false,
              message: "User ID tidak ditemukan",
            };
          }

          const data = JSON.parse(responseText);

          if (data.success === true && data.name) {
            return {
              success: true,
              valid: true,
              username: data.name,
              message: "Valid User ID",
              game: product.name,
            };
          } else {
            return {
              success: true,
              valid: false,
              message: "User ID tidak ditemukan",
            };
          }
        } catch (err) {
          console.error("AOV validation error:", err);
          return {
            success: false,
            valid: true,
            message: "Validation service error - proceeding without validation",
          };
        }
      }

      // Honkai Impact 3rd - use isan.eu.org
      const isHonkaiImpact = product.name.toLowerCase().includes("honkai impact");
      
      if (isHonkaiImpact) {
        console.log("🎮 Using Isan.eu.org API for Honkai Impact 3rd validation");
        
        const validationUrl = `${VALIDATION_API_BASE}/hi?id=${req.userId}`;
        console.log("Validation URL:", validationUrl);

        try {
          const response = await fetch(validationUrl);
          const responseText = await response.text();
          
          console.log("Honkai Impact Validation API response status:", response.status);
          console.log("Honkai Impact Validation API response:", responseText);

          if (!response.ok) {
            return {
              success: true,
              valid: false,
              message: "UID tidak ditemukan",
            };
          }

          const data = JSON.parse(responseText);

          if (data.success === true && data.name) {
            return {
              success: true,
              valid: true,
              username: data.name,
              message: "Valid UID",
              game: product.name,
            };
          } else {
            return {
              success: true,
              valid: false,
              message: "UID tidak ditemukan",
            };
          }
        } catch (err) {
          console.error("Honkai Impact validation error:", err);
          return {
            success: false,
            valid: true,
            message: "Validation service error - proceeding without validation",
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

      let encodedUserId = req.userId;
      
      const isValorant = product.slug === "valorant" || product.name.toLowerCase().includes("valorant");
      
      console.log("DEBUG - product.slug:", product.slug);
      console.log("DEBUG - product.name:", product.name);
      console.log("DEBUG - isValorant:", isValorant);
      console.log("DEBUG - encodedUserId:", encodedUserId);
      console.log("DEBUG - has #:", encodedUserId.includes("#"));
      
      if (isValorant && encodedUserId.includes("#")) {
        encodedUserId = encodedUserId.replace(/#/g, "%23");
        console.log("✅ Valorant ID encoded:", req.userId, "->", encodedUserId);
      } else if (isValorant) {
        console.log("⚠️ Valorant detected but no # in ID:", encodedUserId);
      }

      let validationUrl = `${VALIDATION_API_BASE}${gameConfig.endpoint}?id=${encodedUserId}`;
      
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
