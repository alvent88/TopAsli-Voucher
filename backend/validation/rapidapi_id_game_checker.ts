import { secret } from "encore.dev/config";

const rapidApiKey = secret("RapidAPIKeyIDGameChecker");

const RAPIDAPI_BASE_URL = "https://id-game-checker.p.rapidapi.com";

export interface RapidAPIIDGameCheckerResult {
  success: boolean;
  username?: string;
  message?: string;
}

const GAME_ENDPOINT_MAP: Record<string, string> = {
  "cod-mobile": "cod-mobile",
};

export const validateWithRapidAPIIDGameChecker = async (
  gameSlug: string,
  userId: string
): Promise<RapidAPIIDGameCheckerResult> => {
  try {
    const endpoint = GAME_ENDPOINT_MAP[gameSlug];
    
    if (!endpoint) {
      return {
        success: false,
        message: "Game not supported by RapidAPI ID Game Checker",
      };
    }

    const apiKey = rapidApiKey();
    
    if (!apiKey) {
      console.warn("⚠️ RapidAPI ID Game Checker key not configured - skipping validation");
      return {
        success: false,
        message: "RapidAPI ID Game Checker key not configured",
      };
    }

    const url = `${RAPIDAPI_BASE_URL}/${endpoint}/${encodeURIComponent(userId)}`;

    console.log("🔍 RapidAPI ID Game Checker request URL:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "id-game-checker.p.rapidapi.com",
      },
    });

    console.log("RapidAPI ID Game Checker response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("RapidAPI ID Game Checker error:", response.status, errorText);
      
      if (response.status === 429) {
        return {
          success: false,
          message: "Rate limit exceeded",
        };
      }
      
      return {
        success: false,
        message: "User ID not found",
      };
    }

    const data = await response.json() as any;
    console.log("RapidAPI ID Game Checker response data:", JSON.stringify(data, null, 2));

    if (data.success === true && data.data?.username) {
      return {
        success: true,
        username: data.data.username,
        message: "User ID validated successfully",
      };
    }

    if (data.username) {
      return {
        success: true,
        username: data.username,
        message: "User ID validated successfully",
      };
    }

    if (data.error || data.message) {
      return {
        success: false,
        message: data.message || data.error || "User ID not found",
      };
    }

    return {
      success: false,
      message: "User ID not found",
    };

  } catch (error) {
    console.error("RapidAPI ID Game Checker validation error:", error);
    return {
      success: false,
      message: "Validation service temporarily unavailable",
    };
  }
};
