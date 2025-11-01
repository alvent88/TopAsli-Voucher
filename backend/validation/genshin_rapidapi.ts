import { secret } from "encore.dev/config";

const rapidApiKey = secret("RapidApiKey");

export interface GenshinValidationResponse {
  success: boolean;
  username?: string;
  message?: string;
}

export const validateGenshinUsername = async (
  userId: string,
  server: string = "asia"
): Promise<GenshinValidationResponse> => {
  try {
    const apiKey = rapidApiKey();
    
    if (!apiKey || apiKey.trim() === "") {
      console.warn("⚠️ RapidApiKey not configured - Genshin validation disabled");
      return {
        success: false,
        message: "RapidAPI key not configured",
      };
    }

    const url = `https://check-id-game.p.rapidapi.com/api/rapid_api/test_game_genshin/${userId}/${server}`;
    
    console.log("🎮 Calling Genshin validation API:", url);
    console.log("Server:", server);
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-host": "check-id-game.p.rapidapi.com",
        "x-rapidapi-key": apiKey,
      },
    });

    console.log("Response status:", response.status);

    if (!response.ok) {
      console.error("RapidAPI error - Status:", response.status);
      const errorText = await response.text();
      console.error("Error response:", errorText);
      
      return {
        success: false,
        message: "User ID not found or invalid server",
      };
    }

    const data = await response.json() as any;
    console.log("RapidAPI response:", JSON.stringify(data, null, 2));

    if (data.status === "success" && data.data?.username) {
      console.log("✅ Genshin username found:", data.data.username);
      return {
        success: true,
        username: data.data.username,
        message: "Username found",
      };
    } else if (data.status === "error") {
      console.log("❌ Genshin validation failed:", data.message);
      return {
        success: false,
        message: data.message || "User ID not found",
      };
    } else {
      console.log("❌ Unexpected response format");
      return {
        success: false,
        message: "User ID not found",
      };
    }
  } catch (err: any) {
    console.error("Genshin validation error:", err);
    console.error("Error details:", err.message);
    
    return {
      success: false,
      message: "Validation service error",
    };
  }
};
