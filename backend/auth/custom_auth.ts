import { Header, APIError } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";

interface AuthParams {
  authorization?: Header<"Authorization">;
}

export interface AuthData {
  userID: string;
  email: string;
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

  const isSuperAdmin = decoded.email === "alvent88@gmail.com";
  const isAdmin = isSuperAdmin;

  return {
    userID: decoded.userId,
    email: decoded.email,
    fullName: decoded.fullName,
    isAdmin: isAdmin,
    isSuperAdmin: isSuperAdmin,
  };
});

function parseToken(token: string): { userId: string; email: string; fullName: string } | null {
  try {
    const payload = Buffer.from(token, "base64").toString("utf-8");
    const data = JSON.parse(payload);
    
    if (!data.userId || !data.email) {
      return null;
    }
    
    return {
      userId: data.userId,
      email: data.email,
      fullName: data.fullName || "",
    };
  } catch {
    return null;
  }
}

export function generateToken(userId: string, email: string, fullName: string): string {
  const payload = JSON.stringify({ userId, email, fullName });
  return Buffer.from(payload).toString("base64");
}
