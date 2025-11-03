import { secret } from "encore.dev/config";

const rapidApiKey = secret("RapidAPIKey");

const RAPIDAPI_BASE_URL = "https://check-id-game.p.rapidapi.com";

export interface RapidAPIValidationResult {
  success: boolean;
  username?: string;
  server?: string;
  country?: string;
  message?: string;
}

const GAME_ENDPOINT_MAP: Record<string, string> = {
  "genshin-impact": "/check/genshin",
  "mobile-legends": "/check/mlbb",
  "free-fire": "/check/freefire",
  "pubg-mobile": "/check/pubgm",
  "arena-of-valor": "/check/aov",
};

const SERVER_MAPPING: Record<string, string> = {
  "America": "os_usa",
  "Europe": "os_euro",
  "Asia": "os_asia",
  "TW, HK, MO": "os_cht",
};

export const validateWithRapidAPI = async (
  gameSlug: string,
  userId: string,
  zoneId: string = ""
): Promise<RapidAPIValidationResult> => {
  try {
    const endpoint = GAME_ENDPOINT_MAP[gameSlug];
    
    if (!endpoint) {
      return {
        success: false,
        message: "Game not supported by RapidAPI",
      };
    }

    const apiKey = rapidApiKey();
    
    if (!apiKey) {
      console.warn("⚠️ RapidAPI key not configured - skipping RapidAPI validation");
      return {
        success: false,
        message: "RapidAPI key not configured",
      };
    }

    const mappedZoneId = SERVER_MAPPING[zoneId] || zoneId;
    
    const url = `${RAPIDAPI_BASE_URL}${endpoint}`;
    const body = {
      userId: userId,
      zoneId: mappedZoneId,
    };

    console.log("🔍 RapidAPI request URL:", url);
    console.log("🔍 RapidAPI request body:", body);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "check-id-game.p.rapidapi.com",
      },
      body: JSON.stringify(body),
    });

    console.log("RapidAPI response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("RapidAPI error:", response.status, errorText);
      
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
    console.log("RapidAPI response data:", JSON.stringify(data, null, 2));

    if (data.success === true || data.status === "success") {
      return {
        success: true,
        username: data.username || data.name || data.nickname,
        server: data.server || data.region,
        country: data.country,
        message: "User ID validated successfully",
      };
    }

    return {
      success: false,
      message: data.message || "User ID not found",
    };

  } catch (error) {
    console.error("RapidAPI validation error:", error);
    return {
      success: false,
      message: "Validation service temporarily unavailable",
    };
  }
};
