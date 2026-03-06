import { Elysia, t } from "elysia";
import { ConvexHttpClient } from "convex/browser";
import { config } from "../config/env";
import { encrypt } from "../services/encryption";

const convex = new ConvexHttpClient(config.CONVEX_URL);

/**
 * Auth routes for X OAuth
 * Note: Most auth is handled by Convex Auth at /auth/*
 * These are additional routes for callbacks and status
 */
export const authRoutes = new Elysia({ prefix: "/auth" })
  // GET /auth/status - Check auth status
  .get("/status", async ({ request }: any) => {
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader) {
      return {
        authenticated: false,
        xConnected: false,
      };
    }

    // TODO: Verify with Convex Auth
    // For now, return mock status
    return {
      authenticated: true,
      xConnected: false, // Would check Convex user record
      user: {
        id: "user_123",
        email: "user@example.com",
      },
    };
  })

  // GET /auth/x/connect - Initiate X OAuth
  // Note: Actual OAuth is handled by Convex Auth
  .get("/x/connect", async ({ set }: any) => {
    // Redirect to Convex Auth sign-in with X provider
    const convexAuthUrl = `${config.CONVEX_URL}/auth/signin/x`;
    
    set.status = 302;
    set.headers["Location"] = convexAuthUrl;
    
    return {
      message: "Redirecting to X OAuth",
      redirectUrl: convexAuthUrl,
    };
  })

  // POST /auth/x/callback - Handle X OAuth callback
  // This would be called by Convex Auth after successful OAuth
  .post("/x/callback", async ({ body, set }: any) => {
    try {
      const { code, state } = body;
      
      // In production, this would:
      // 1. Exchange code for tokens with X API
      // 2. Encrypt tokens
      // 3. Store in Convex
      // 4. Create/update user record
      
      // Mock implementation
      const tokens = {
        accessToken: "mock_access_token",
        refreshToken: "mock_refresh_token",
        expiresIn: 7200,
      };
      
      const profile = {
        id: "x_user_123",
        username: "@testuser",
        displayName: "Test User",
        avatarUrl: "https://example.com/avatar.jpg",
        bio: "Test bio",
        followersCount: 1000,
        followingCount: 500,
        verified: false,
      };

      // Encrypt tokens
      const encryptedAccessToken = encrypt(tokens.accessToken);
      const encryptedRefreshToken = encrypt(tokens.refreshToken);

      // Store in Convex (would call Convex mutation)
      // await convex.mutation(api.users.storeXTokens, { ... });

      return {
        success: true,
        message: "X account connected successfully",
        user: {
          xUserId: profile.id,
          xUsername: profile.username,
        },
      };
    } catch (error) {
      set.status = 500;
      return {
        success: false,
        error: "Failed to connect X account",
        details: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }, {
    body: t.Object({
      code: t.String(),
      state: t.String(),
    }),
  })

  // POST /auth/x/disconnect - Disconnect X account
  .post("/x/disconnect", async ({ request, set }: any) => {
    // Verify auth
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    // TODO: Call Convex to remove X tokens
    // await convex.mutation(api.users.disconnectX, {});

    return {
      success: true,
      message: "X account disconnected",
    };
  })

  // GET /auth/me - Get current user info
  .get("/me", async ({ request, set }: any) => {
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader) {
      set.status = 401;
      return {
        error: "Unauthorized",
        code: "NO_TOKEN",
      };
    }

    // TODO: Get user from Convex
    // const user = await convex.query(api.users.getCurrentWithX, {});
    
    return {
      success: true,
      data: {
        id: "user_123",
        email: "user@example.com",
        name: "Test User",
        xConnected: true,
        xUsername: "@testuser",
      },
    };
  });

export default authRoutes;
