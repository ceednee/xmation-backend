// @ts-nocheck
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get current user with X connection status
 */
export const getCurrentWithX = query({
  handler: async (ctx) => {
    const userId = await ctx.auth.getUserIdentity();
    
    if (!userId) {
      return null;
    }

    // Get user with X data
    const user = await ctx.db
      .query("users")
      .withIndex("by_xUserId")
      .filter((q) => q.eq(q.field("_id"), userId.subject))
      .first();

    if (!user) {
      return null;
    }

    return {
      _id: user._id,
      email: user.email,
      name: user.name,
      image: user.image,
      xConnected: !!user.xAccessToken,
      xUsername: user.xUsername,
      xUserId: user.xUserId,
      profile: user.profile,
      preferences: user.preferences,
    };
  },
});

/**
 * Store X OAuth tokens (encrypted)
 */
export const storeXTokens = mutation({
  args: {
    xUserId: v.string(),
    xUsername: v.string(),
    xAccessToken: v.string(), // Should be encrypted before calling
    xRefreshToken: v.string(), // Should be encrypted before calling
    xTokenExpiresAt: v.number(),
    xScopes: v.array(v.string()),
    profile: v.object({
      displayName: v.string(),
      avatarUrl: v.string(),
      bio: v.string(),
      followersCount: v.number(),
      followingCount: v.number(),
      verified: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(userId.subject as any);
    
    if (!user) {
      throw new Error("User not found");
    }

    // Update user with X data
    await ctx.db.patch(userId.subject as any, {
      xUserId: args.xUserId,
      xUsername: args.xUsername,
      xAccessToken: args.xAccessToken,
      xRefreshToken: args.xRefreshToken,
      xTokenExpiresAt: args.xTokenExpiresAt,
      xScopes: args.xScopes,
      profile: args.profile,
      xConnectedAt: Date.now(),
      lastTokenRefresh: Date.now(),
      preferences: {
        timezone: "UTC",
        dryRunDefault: true,
        notificationsEnabled: true,
      },
    });

    return { success: true };
  },
});

/**
 * Get X tokens for API calls (returns encrypted tokens)
 */
export const getXTokens = query({
  handler: async (ctx) => {
    const userId = await ctx.auth.getUserIdentity();
    
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(userId.subject as any);
    
    if (!user || !user.xAccessToken) {
      return null;
    }

    // Check if token needs refresh (expires in next 5 minutes)
    const needsRefresh = user.xTokenExpiresAt < Date.now() + 5 * 60 * 1000;

    return {
      xAccessToken: user.xAccessToken,
      xRefreshToken: user.xRefreshToken,
      xTokenExpiresAt: user.xTokenExpiresAt,
      needsRefresh,
    };
  },
});

/**
 * Update X tokens after refresh
 */
export const updateXTokens = mutation({
  args: {
    xAccessToken: v.string(),
    xRefreshToken: v.string(),
    xTokenExpiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    
    if (!userId) {
      throw new Error("Not authenticated");
    }

    await ctx.db.patch(userId.subject as any, {
      xAccessToken: args.xAccessToken,
      xRefreshToken: args.xRefreshToken,
      xTokenExpiresAt: args.xTokenExpiresAt,
      lastTokenRefresh: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Disconnect X account
 */
export const disconnectX = mutation({
  handler: async (ctx) => {
    const userId = await ctx.auth.getUserIdentity();
    
    if (!userId) {
      throw new Error("Not authenticated");
    }

    await ctx.db.patch(userId.subject as any, {
      xUserId: undefined,
      xUsername: undefined,
      xAccessToken: undefined,
      xRefreshToken: undefined,
      xTokenExpiresAt: undefined,
      xScopes: undefined,
      profile: undefined,
    });

    return { success: true };
  },
});

/**
 * Verify if user has X connection
 */
export const hasXConnection = query({
  handler: async (ctx) => {
    const userId = await ctx.auth.getUserIdentity();
    
    if (!userId) {
      return { connected: false, error: "NOT_AUTHENTICATED" };
    }

    const user = await ctx.db.get(userId.subject as any);
    
    if (!user) {
      return { connected: false, error: "USER_NOT_FOUND" };
    }

    if (!user.xAccessToken) {
      return { connected: false, error: "X_NOT_CONNECTED" };
    }

    return { 
      connected: true, 
      xUsername: user.xUsername,
      xUserId: user.xUserId,
    };
  },
});

/**
 * Get all active users (for cron jobs)
 */
export const getActiveUsers = query({
  handler: async (ctx) => {
    const users = await ctx.db
      .query("users")
      .filter((q) => q.neq(q.field("xAccessToken"), undefined))
      .collect();

    return users.map((user) => ({
      _id: user._id,
      xUserId: user.xUserId,
      xUsername: user.xUsername,
    }));
  },
});
