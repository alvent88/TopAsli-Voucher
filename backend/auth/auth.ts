import { createClerkClient, verifyToken } from "@clerk/backend";
import { Header, APIError, Gateway } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";
import { secret } from "encore.dev/config";

const clerkSecretKey = secret("ClerkSecretKey");
const clerkClient = createClerkClient({ secretKey: clerkSecretKey() });

interface AuthParams {
  authorization?: Header<"Authorization">;
}

export interface AuthData {
  userID: string;
  imageUrl: string;
  email: string | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

export const auth = authHandler<AuthParams, AuthData>(async (data) => {
  const token = data.authorization?.replace("Bearer ", "");
  if (!token) {
    throw APIError.unauthenticated("missing token");
  }

  try {
    const verifiedToken = await verifyToken(token, {
      secretKey: clerkSecretKey(),
    });

    const user = await clerkClient.users.getUser(verifiedToken.sub);
    const email = user.emailAddresses[0]?.emailAddress ?? null;
    
    const isSuperAdmin = email === "alvent88@gmail.com" || (user.publicMetadata?.isSuperAdmin === true);
    const isAdmin = isSuperAdmin || (user.publicMetadata?.isAdmin === true);
    
    return {
      userID: user.id,
      imageUrl: user.imageUrl,
      email: email,
      isAdmin: isAdmin,
      isSuperAdmin: isSuperAdmin,
    };
  } catch (err) {
    throw APIError.unauthenticated("invalid token", err as Error);
  }
});

export const gw = new Gateway({ authHandler: auth });
