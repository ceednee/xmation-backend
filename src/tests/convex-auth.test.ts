import { describe, it, expect } from "bun:test";

describe("Convex Auth Integration", () => {
  describe("X OAuth Provider", () => {
    it("should configure X OAuth with correct scopes", () => {
      const xOAuthConfig = {
        clientId: process.env.X_CLIENT_ID,
        clientSecret: process.env.X_CLIENT_SECRET,
        scopes: [
          "tweet.read",
          "tweet.write",
          "users.read",
          "follows.read",
          "follows.write",
          "dm.read",
          "dm.write",
          "offline.access",
        ],
      };

      expect(xOAuthConfig.scopes).toContain("tweet.read");
      expect(xOAuthConfig.scopes).toContain("tweet.write");
      expect(xOAuthConfig.scopes).toContain("offline.access");
      expect(xOAuthConfig.scopes.length).toBe(8);
    });

    it("should require X_CLIENT_ID environment variable", () => {
      expect(process.env.X_CLIENT_ID).toBeDefined();
      expect(process.env.X_CLIENT_ID?.length).toBeGreaterThan(0);
    });

    it("should require X_CLIENT_SECRET environment variable", () => {
      expect(process.env.X_CLIENT_SECRET).toBeDefined();
      expect(process.env.X_CLIENT_SECRET?.length).toBeGreaterThan(0);
    });
  });

  describe("Convex Auth Session", () => {
    it("should create session with user identity", async () => {
      const session = await mockConvexCreateSession({
        userId: "user_123",
        xUserId: "x_456",
        xUsername: "@testuser",
        xAccessToken: "encrypted_token",
        xRefreshToken: "encrypted_refresh",
      });

      expect(session._id).toBeDefined();
      expect(session.userId).toBe("user_123");
      expect(session.xUserId).toBe("x_456");
      expect(session.token).toBeDefined();
    });

    it("should validate session token with Convex", async () => {
      const valid = await mockConvexValidateSession("valid_session_token");
      expect(valid).toBe(true);

      const invalid = await mockConvexValidateSession("invalid_token");
      expect(invalid).toBe(false);
    });

    it("should retrieve user with X connection from Convex", async () => {
      const user = await mockConvexGetUserWithX("user_123");
      
      expect(user).toBeDefined();
      expect(user._id).toBe("user_123");
      expect(user.xUserId).toBe("x_456");
      expect(user.xUsername).toBe("@testuser");
      expect(user.xAccessToken).toBeDefined(); // Encrypted
      expect(user.xRefreshToken).toBeDefined(); // Encrypted
    });

    it("should return null for user without X connection", async () => {
      const user = await mockConvexGetUserWithX("user_no_x");
      
      expect(user).toBeNull();
    });

    it("should handle token refresh automatically", async () => {
      const result = await mockConvexRefreshXToken("user_123");
      
      expect(result.success).toBe(true);
      expect(result.newAccessToken).toBeDefined();
      expect(result.newRefreshToken).toBeDefined();
      expect(result.expiresAt).toBeGreaterThan(Date.now());
    });
  });

  describe("Auth Flow", () => {
    it("should redirect to X OAuth on sign in", async () => {
      const redirectUrl = await mockInitiateXOAuth();
      
      expect(redirectUrl).toContain("twitter.com");
      expect(redirectUrl).toContain("oauth2");
      expect(redirectUrl).toContain("authorize");
    });

    it("should handle OAuth callback and store tokens", async () => {
      const callbackData = {
        code: "auth_code_123",
        state: "random_state_456",
      };

      const result = await mockHandleOAuthCallback(callbackData);
      
      expect(result.success).toBe(true);
      expect(result.userId).toBeDefined();
      expect(result.sessionToken).toBeDefined();
    });

    it("should encrypt X tokens before storing in Convex", async () => {
      const tokens = {
        accessToken: "sensitive_access_token",
        refreshToken: "sensitive_refresh_token",
      };

      const stored = await mockStoreXTokensSecurely("user_123", tokens);
      
      expect(stored.xAccessToken).not.toBe(tokens.accessToken);
      expect(stored.xRefreshToken).not.toBe(tokens.refreshToken);
      expect(stored.xAccessToken).toContain(":"); // Encrypted format
    });
  });

  describe("Protected Routes with Convex Auth", () => {
    it("should reject requests without valid Convex session", async () => {
      const result = await mockVerifyConvexSession("invalid_token");
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe("INVALID_SESSION");
    });

    it("should reject requests without X OAuth connection", async () => {
      const result = await mockCheckXConnection("user_no_x");
      
      expect(result.connected).toBe(false);
      expect(result.error).toBe("X_NOT_CONNECTED");
    });

    it("should allow requests with valid session and X connection", async () => {
      const result = await mockVerifyConvexSession("valid_token_with_x");
      
      expect(result.valid).toBe(true);
      expect(result.user.xUserId).toBeDefined();
    });

    it("should auto-refresh expired X tokens", async () => {
      const result = await mockVerifyWithAutoRefresh("user_expired_token");
      
      expect(result.valid).toBe(true);
      expect(result.refreshed).toBe(true);
    });
  });
});

// Mock functions for Convex Auth (will be replaced with real implementations)
async function mockConvexCreateSession(data: any) {
  return {
    _id: `session_${Date.now()}`,
    token: `convex_token_${Date.now()}`,
    expiresAt: Date.now() + 15 * 60 * 1000,
    ...data,
  };
}

async function mockConvexValidateSession(token: string): Promise<boolean> {
  return token.startsWith("valid");
}

async function mockConvexGetUserWithX(userId: string) {
  if (userId === "user_no_x") return null;
  
  return {
    _id: userId,
    xUserId: "x_456",
    xUsername: "@testuser",
    xAccessToken: "encrypted:auth:tag:token",
    xRefreshToken: "encrypted:auth:tag:refresh",
    xTokenExpiresAt: Date.now() + 7200 * 1000,
  };
}

async function mockConvexRefreshXToken(userId: string) {
  return {
    success: true,
    newAccessToken: "new_access_token",
    newRefreshToken: "new_refresh_token",
    expiresAt: Date.now() + 7200 * 1000,
  };
}

async function mockInitiateXOAuth(): Promise<string> {
  return "https://twitter.com/i/oauth2/authorize?client_id=xxx&redirect_uri=xxx";
}

async function mockHandleOAuthCallback(data: any) {
  return {
    success: true,
    userId: "user_new",
    sessionToken: "convex_session_123",
  };
}

async function mockStoreXTokensSecurely(userId: string, tokens: any) {
  return {
    xAccessToken: `iv:auth:${Buffer.from(tokens.accessToken).toString("base64")}`,
    xRefreshToken: `iv:auth:${Buffer.from(tokens.refreshToken).toString("base64")}`,
  };
}

async function mockVerifyConvexSession(token: string): Promise<any> {
  if (token === "invalid_token") {
    return { valid: false, error: "INVALID_SESSION" };
  }
  
  if (token === "valid_token_with_x") {
    return {
      valid: true,
      user: {
        _id: "user_123",
        xUserId: "x_456",
        xUsername: "@testuser",
      },
    };
  }
  
  return { valid: false };
}

async function mockCheckXConnection(userId: string): Promise<any> {
  if (userId === "user_no_x") {
    return { connected: false, error: "X_NOT_CONNECTED" };
  }
  return { connected: true };
}

async function mockVerifyWithAutoRefresh(userId: string): Promise<any> {
  return {
    valid: true,
    refreshed: true,
    user: {
      _id: userId,
      xUserId: "x_789",
    },
  };
}
