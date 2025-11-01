interface SandrocodsValidationResponse {
  status: boolean;
  message: string;
  nickname?: string;
  type_name?: string;
  server_time?: string;
}

const API_BASE_URL = "https://api-cek-id-game-ten.vercel.app/api/check-id-game";

const GAME_TYPE_MAP: Record<string, string> = {
  "genshin-impact": "genshin_impact",
  "honkai-star-rail": "honkai_star_rail",
  "cod-mobile": "call_of_duty",
  "point-blank": "point_blank",
  "valorant": "valorant",
  "pubg-mobile": "pubg_mobile",
};

export const validateUsernameWithSandrocods = async (
  gameSlug: string,
  userId: string,
  zoneId: string = ""
): Promise<{ success: boolean; username?: string; message?: string }> => {
  try {
    const typeName = GAME_TYPE_MAP[gameSlug];
    
    if (!typeName) {
      console.log("⚠️ Game not supported by sandrocods API:", gameSlug);
      return {
        success: false,
        message: "Validation not available for this game",
      };
    }

    console.log("🎮 Validating with sandrocods API");
    console.log("Game slug:", gameSlug);
    console.log("Type name:", typeName);
    console.log("User ID:", userId);
    console.log("Zone ID:", zoneId);

    const url = `${API_BASE_URL}?type_name=${encodeURIComponent(typeName)}&userId=${userId}&zoneId=${encodeURIComponent(zoneId)}`;
    
    console.log("Request URL:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = (await response.json()) as SandrocodsValidationResponse;
    
    console.log("API Response:", JSON.stringify(data, null, 2));

    if (data.status === true && data.nickname) {
      console.log("✅ Username found:", data.nickname);
      return {
        success: true,
        username: data.nickname,
        message: "Username found",
      };
    } else {
      console.log("❌ Username not found:", data.message);
      return {
        success: false,
        message: data.message || "User ID not found",
      };
    }
  } catch (err: any) {
    console.error("❌ Sandrocods validation error:", err);
    console.error("Error details:", err.message);
    
    return {
      success: false,
      message: "Validation service error",
    };
  }
};
