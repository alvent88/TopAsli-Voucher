const CEK_USERNAME_BASE_URL = "https://cek-username.onrender.com";

export interface CekUsernameValidationResult {
  success: boolean;
  username?: string;
  message?: string;
}

const GAME_ENDPOINT_MAP: Record<string, string> = {
  "genshin-impact": "genshinimpact",
  "mobile-legends": "mobilelegends",
  "free-fire": "freefire",
  "pubg-mobile": "pubgmobile",
  "cod-mobile": "callofdutymobile",
  "honkai-star-rail": "honkaistarrail",
  "honkai-impact": "honkaiimpact",
  "arena-of-valor": "arenaofvalor",
};

const SERVER_MAPPING: Record<string, string> = {
  "America": "os_usa",
  "Europe": "os_euro",
  "Asia": "os_asia",
  "TW, HK, MO": "os_cht",
};

export const validateWithCekUsername = async (
  gameSlug: string,
  userId: string,
  zoneId: string = ""
): Promise<CekUsernameValidationResult> => {
  try {
    const gameEndpoint = GAME_ENDPOINT_MAP[gameSlug];
    
    if (!gameEndpoint) {
      return {
        success: false,
        message: "Game not supported by cek-username API",
      };
    }

    const mappedZoneId = SERVER_MAPPING[zoneId] || zoneId;
    
    let url = `${CEK_USERNAME_BASE_URL}/game/${gameEndpoint}?uid=${encodeURIComponent(userId)}`;
    
    if (mappedZoneId) {
      url += `&zone=${encodeURIComponent(mappedZoneId)}`;
    }

    console.log("🔍 cek-username API request URL:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    console.log("cek-username API response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("cek-username API error:", response.status, errorText);
      
      return {
        success: false,
        message: "User ID not found",
      };
    }

    const data = await response.json() as any;
    console.log("cek-username API response data:", JSON.stringify(data, null, 2));

    if (data.message === "Success" && data.data) {
      return {
        success: true,
        username: data.data,
        message: "User ID validated successfully",
      };
    }

    if (data.message && data.message !== "Success") {
      return {
        success: false,
        message: data.message || "User ID not found",
      };
    }

    return {
      success: false,
      message: "User ID not found",
    };

  } catch (error) {
    console.error("cek-username API validation error:", error);
    return {
      success: false,
      message: "Validation service temporarily unavailable",
    };
  }
};
