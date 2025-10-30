import { api } from "encore.dev/api";

export interface TestIsanAPIRequest {
  game: string;
  userId: string;
  serverId?: string;
}

export interface TestIsanAPIResponse {
  success: boolean;
  apiUrl: string;
  httpStatus: number;
  responseText: string;
  parsedData?: any;
  error?: string;
}

const VALIDATION_API_BASE = "https://api.isan.eu.org/nickname";

const ENDPOINTS: Record<string, string> = {
  "ml": "/ml",
  "ff": "/ff",
  "pubgm": "/pubgm",
  "codm": "/codm",
  "aov": "/aov",
};

export const testIsanAPI = api<TestIsanAPIRequest, TestIsanAPIResponse>(
  { expose: true, method: "POST", path: "/validation/test-isan-api", auth: true },
  async (req: TestIsanAPIRequest) => {
    try {
      const endpoint = ENDPOINTS[req.game];
      
      if (!endpoint) {
        return {
          success: false,
          apiUrl: "",
          httpStatus: 0,
          responseText: "",
          error: `Game "${req.game}" not supported. Use: ml, ff, pubgm, codm, aov`,
        };
      }

      let apiUrl = `${VALIDATION_API_BASE}${endpoint}?id=${req.userId}`;
      
      if (req.serverId) {
        apiUrl += `&server=${req.serverId}`;
      }

      console.log("=== Testing Isan API ===");
      console.log("API URL:", apiUrl);

      const response = await fetch(apiUrl);
      const responseText = await response.text();

      console.log("HTTP Status:", response.status);
      console.log("Response Text:", responseText);

      let parsedData;
      try {
        parsedData = JSON.parse(responseText);
      } catch (e) {
        parsedData = null;
      }

      return {
        success: true,
        apiUrl,
        httpStatus: response.status,
        responseText,
        parsedData,
      };

    } catch (err) {
      console.error("Test Isan API error:", err);
      return {
        success: false,
        apiUrl: "",
        httpStatus: 0,
        responseText: "",
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
);
