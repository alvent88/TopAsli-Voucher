const VELIXS_API_KEY = "9d4cc67a51fefa7b0595839eeff82650fdd04fcb81130d6cd7";
const VELIXS_BASE_URL = "https://api.velixs.com/idgames-checker";

export interface VelixsValidationResult {
  success: boolean;
  username?: string;
  message?: string;
}

const GAME_SLUG_MAP: Record<string, string> = {
  "arena-of-valor": "aov",
  "call-of-duty-mobile": "codm",
  "cod-mobile": "codm",
};

export const validateWithVelixs = async (
  gameSlug: string,
  userId: string
): Promise<VelixsValidationResult> => {
  try {
    const gameName = GAME_SLUG_MAP[gameSlug];
    
    if (!gameName) {
      return {
        success: false,
        message: "Game not supported by Velixs API",
      };
    }

    const url = VELIXS_BASE_URL;
    const body = {
      game: gameName,
      id: userId,
      apikey: VELIXS_API_KEY,
    };

    console.log("🔍 Velixs API request:", { game: gameName, id: userId });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    console.log("Velixs API response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Velixs API error:", response.status, errorText);
      
      return {
        success: false,
        message: "User ID not found",
      };
    }

    const data = await response.json() as any;
    console.log("Velixs API response data:", JSON.stringify(data, null, 2));

    if (data.status === true && data.data?.username) {
      return {
        success: true,
        username: data.data.username,
        message: "User ID validated successfully",
      };
    }

    if (data.status === false) {
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
    console.error("Velixs API validation error:", error);
    return {
      success: false,
      message: "Validation service temporarily unavailable",
    };
  }
};
