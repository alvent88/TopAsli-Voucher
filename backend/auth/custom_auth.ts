import { Header, APIError, Gateway } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";

interface AuthParams {
  authorization?: Header<"Authorization">;
}

export interface AuthData {
  userID: string;
  phoneNumber: string;
  fullName: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

export const auth = authHandler<AuthParams, AuthData>(async (data) => {
  const authHeader = data.authorization;
  
  if (!authHeader) {
    throw APIError.unauthenticated("missing authorization header");
  }

  const parts = authHeader.split(" ");
  
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    throw APIError.unauthenticated("invalid authorization format");
  }

  const token = parts[1];
  
  const decoded = parseToken(token);
  
  if (!decoded) {
    throw APIError.unauthenticated("invalid token");
  }

  const isSuperAdmin = decoded.phoneNumber === "62818848168";
  const isAdmin = isSuperAdmin;

  return {
    userID: decoded.userId,
    phoneNumber: decoded.phoneNumber,
    fullName: decoded.fullName,
    isAdmin: isAdmin,
    isSuperAdmin: isSuperAdmin,
  };
});

export const gw = new Gateway({ authHandler: auth });

function parseToken(token: string): { userId: string; phoneNumber: string; fullName: string } | null {
  try {
    const payload = Buffer.from(token, "base64").toString("utf-8");
    const data = JSON.parse(payload);
    
    if (!data.userId || !data.phoneNumber) {
      return null;
    }
    
    return {
      userId: data.userId,
      phoneNumber: data.phoneNumber,
      fullName: data.fullName || "",
    };
  } catch {
    return null;
  }
}

export function generateToken(userId: string, phoneNumber: string, fullName: string): string {
  const payload = JSON.stringify({ userId, phoneNumber, fullName });
  return Buffer.from(payload).toString("base64");
}
