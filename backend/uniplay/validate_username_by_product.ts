import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import { getGameSlugFromProductName } from "./get_game_slug";

export interface ValidateUsernameByProductRequest {
  productId: number;
  userId: string;
  serverId?: string;
}

export interface ValidateUsernameByProductResponse {
  success: boolean;
  username?: string;
  message?: string;
  gameSupported: boolean;
}

export const validateUsernameByProduct = api<ValidateUsernameByProductRequest, ValidateUsernameByProductResponse>(
  { expose: true, method: "POST", path: "/uniplay/validate-username-by-product", auth: true },
  async (req: ValidateUsernameByProductRequest) => {
    const auth = getAuthData()!;

    try {
      console.log("=== Validate Username By Product ===");
      console.log("User ID:", auth.userID);
      console.log("Product ID:", req.productId);
      console.log("Game User ID:", req.userId);
      console.log("Server ID:", req.serverId);

      // Get product name from database
      const product = await db.queryRow<{
        id: number;
        name: string;
      }>`
        SELECT id, name
        FROM products
        WHERE id = ${req.productId}
      `;

      if (!product) {
        throw APIError.notFound("Product not found");
      }

      console.log("Product name:", product.name);

      // Get game slug from product name
      const gameInfo = getGameSlugFromProductName(product.name);

      if (!gameInfo) {
        console.log("Game not supported for username validation");
        return {
          success: false,
          gameSupported: false,
          message: `Username validation not available for ${product.name}`,
        };
      }

      console.log("Game slug:", gameInfo.slug);
      console.log("Requires server:", gameInfo.requiresServer);

      // Validate server ID requirement
      if (gameInfo.requiresServer && !req.serverId) {
        throw APIError.invalidArgument(`Game "${product.name}" requires serverId parameter`);
      }

      // Special handling for Roblox - use different API
      if (gameInfo.slug === "roblox") {
        console.log("Using Roblox API for validation");
        
        // Roblox API: Get user info by User ID
        // Endpoint: https://users.roblox.com/v1/users/{userId}
        const robloxEndpoint = `https://users.roblox.com/v1/users/${req.userId}`;
        
        console.log("Calling Roblox API:", robloxEndpoint);
        
        const robloxResponse = await fetch(robloxEndpoint, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const robloxResponseText = await robloxResponse.text();
        console.log("Roblox Response status:", robloxResponse.status);
        console.log("Roblox Response body:", robloxResponseText);

        if (!robloxResponse.ok) {
          console.log("Roblox API returned non-OK status");
          return {
            success: false,
            gameSupported: true,
            message: "Username Invalid",
          };
        }

        let robloxData: any;
        try {
          robloxData = JSON.parse(robloxResponseText);
        } catch (parseErr) {
          console.error("Failed to parse Roblox JSON:", parseErr);
          return {
            success: false,
            gameSupported: true,
            message: "Username Invalid",
          };
        }

        console.log("Roblox data:", JSON.stringify(robloxData, null, 2));

        // Roblox API returns: { "id": 156, "name": "Builderman", "displayName": "Builderman", ... }
        if (robloxData.name || robloxData.displayName) {
          return {
            success: true,
            gameSupported: true,
            username: robloxData.displayName || robloxData.name,
            message: "Username validated successfully",
          };
        } else {
          return {
            success: false,
            gameSupported: true,
            message: "Username Invalid",
          };
        }
      }

      // Call validation API for other games (isan.eu.org)
      const baseUrl = "https://api.isan.eu.org/nickname";
      const endpoint = `${baseUrl}/${gameInfo.slug}`;

      const requestBody: any = {
        id: req.userId,
      };

      if (gameInfo.requiresServer && req.serverId) {
        requestBody.server = req.serverId;
      }

      console.log("Calling validation API:", endpoint);
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
        console.log("Validation API returned non-OK status");
        return {
          success: false,
          gameSupported: true,
          message: "Username Invalid",
        };
      }

      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch (parseErr) {
        console.error("Failed to parse JSON:", parseErr);
        return {
          success: false,
          gameSupported: true,
          message: "Username Invalid",
        };
      }

      console.log("Validation result:", JSON.stringify(data, null, 2));

      if (data.success && data.name) {
        return {
          success: true,
          gameSupported: true,
          username: data.name,
          message: "Username validated successfully",
        };
      } else {
        return {
          success: false,
          gameSupported: true,
          message: data.message || "Username Invalid",
        };
      }
    } catch (err: any) {
      console.error("❌ Validation failed:", err);
      
      if (err.code) {
        throw err;
      }
      
      // Return as failed validation, not as error
      return {
        success: false,
        gameSupported: true,
        message: "Username Invalid",
      };
    }
  }
);
