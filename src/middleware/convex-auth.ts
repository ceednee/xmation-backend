import { ConvexHttpClient } from "convex/browser";
import { config } from "../config/env";
import { decrypt } from "../services/encryption";

// Convex HTTP client for server-side queries
const convex = new ConvexHttpClient(config.CONVEX_URL);

export interface AuthenticatedUser {
  id: string;
  email?: string;
  name?: string;
  xUserId?: string;
  xUsername?: string;
  xAccessToken?: string; // Decrypted
  xRefreshToken?: string; // Decrypted
  xTokenExpiresAt?: number;
  profile?: {
    displayName: string;
    avatarUrl: string;
    bio: string;
    followersCount: number;
    followingCount: number;
    verified: boolean;
  };
}

/**
 * Verify Convex Auth session token
 */
export async function verifyConvexSession(token: string): Promise<AuthenticatedUser | null> {
  try {
    // Call Convex to verify session
    // Note: In production, you'd use Convex Auth's session verification
    // For now, we'll use a simple approach
    
    // Get user with X connection from Convex
    const result = await convex.query(api.users.getCurrentWithX, { token });
    
    if (!result) {
      return null;
    }

    // If user has X connection, decrypt tokens
    if (result.xConnected) {
      const tokens = await convex.query(api.users.getXTokens, { token });
      
      if (tokens) {
        try {
          result.xAccessToken = decrypt(tokens.xAccessToken);
          result.xRefreshToken = decrypt(tokens.xRefreshToken);
          result.xTokenExpiresAt = tokens.xTokenExpiresAt;
        } catch (e) {
          console.error("Failed to decrypt X tokens:", e);
          return null;
        }
      }
    }

    return result as AuthenticatedUser;
  } catch (error) {
    console.error("Session verification failed:", error);
    return null;
  }
}

/**
 * Middleware: Require Convex Auth session
 */
export const requireConvexAuth = () => async ({ request, set }: any) => {
  const authHeader = request.headers.get("authorization");
  
  if (!authHeader) {
    set.status = 401;
    return {
      error: "Unauthorized",
      code: "NO_TOKEN",
      message: "Authorization header required",
    };
  }

  const token = authHeader.replace("Bearer ", "");
  
  if (!authHeader.startsWith("Bearer ") || !token) {
    set.status = 401;
    return {
      error: "Unauthorized",
      code: "INVALID_FORMAT",
      message: "Authorization header must be 'Bearer <token>'",
    };
  }

  // Verify with Convex
  const user = await verifyConvexSession(token);
  
  if (!user) {
    set.status = 401;
    return {
      error: "Unauthorized",
      code: "INVALID_SESSION",
      message: "Invalid or expired session",
    };
  }

  // Attach user to request
  request.user = user;
};

/**
 * Middleware: Require X OAuth connection
 */
export const requireXConnection = () => async ({ request, set }: any) => {
  const user = request.user;
  
  if (!user) {
    set.status = 401;
    return {
      error: "Unauthorized",
      code: "NO_USER",
      message: "User not authenticated",
    };
  }

  if (!user.xAccessToken) {
    set.status = 403;
    return {
      error: "X account required",
      code: "X_NOT_CONNECTED",
      message: "You must connect your X account to use this feature",
      action: "/auth/x/connect",
    };
  }

  // Check if token is expired and needs refresh
  if (user.xTokenExpiresAt && user.xTokenExpiresAt < Date.now()) {
    // Token is expired - in production, auto-refresh here
    set.status = 403;
    return {
      error: "X token expired",
      code: "X_TOKEN_EXPIRED",
      message: "Your X session has expired. Please reconnect.",
      action: "/auth/x/reconnect",
    };
  }
};

/**
 * Combined middleware for protected routes
 */
export const protectedRoute = () => {
  const auth = requireConvexAuth();
  const xCheck = requireXConnection();

  return async (context: any) => {
    // Check auth
    const authResult = await auth(context);
    if (authResult) return authResult;

    // Check X connection
    const xResult = await xCheck(context);
    if (xResult) return xResult;
  };
};

// Import api for type safety
import type { api } from "../../convex/_generated/api";
