import { query, action } from "./_generated/server";
import { v } from "convex/values";

/**
 * Sync job for mentions (runs every 5 minutes)
 */
export const syncMentions = action({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get user's X credentials
    const user = await ctx.runQuery(api.users.getCurrentWithX);
    if (!user || !user.xUserId) {
      throw new Error("User not connected to X");
    }

    // Call sync service (implemented in Elysia)
    // This is a placeholder - actual sync happens via HTTP API
    console.log(`[Cron] Syncing mentions for user ${args.userId}`);

    return { success: true };
  },
});

/**
 * Sync job for followers (runs every 30 minutes)
 */
export const syncFollowers = action({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    console.log(`[Cron] Syncing followers for user ${args.userId}`);
    return { success: true };
  },
});

/**
 * Sync job for timeline (runs every 15 minutes)
 */
export const syncTimeline = action({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    console.log(`[Cron] Syncing timeline for user ${args.userId}`);
    return { success: true };
  },
});

/**
 * Get sync status for a user
 */
export const getSyncStatus = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // This would integrate with the sync service
    return {
      lastMentionAt: null,
      lastFollowerSyncAt: null,
      lastTimelineSyncAt: null,
    };
  },
});

/**
 * Cron handler: Sync mentions for all active users
 */
export const syncMentionsCron = action({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.runQuery(api.users.getActiveUsers);

    for (const user of users) {
      try {
        await ctx.runAction(api.sync.syncMentions, { userId: user._id });
      } catch (error) {
        console.error(`[Cron] Failed to sync mentions for ${user._id}:`, error);
      }
    }
  },
});

/**
 * Cron handler: Sync followers for all active users
 */
export const syncFollowersCron = action({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.runQuery(api.users.getActiveUsers);

    for (const user of users) {
      try {
        await ctx.runAction(api.sync.syncFollowers, { userId: user._id });
      } catch (error) {
        console.error(`[Cron] Failed to sync followers for ${user._id}:`, error);
      }
    }
  },
});

/**
 * Cron handler: Sync timeline for all active users
 */
export const syncTimelineCron = action({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.runQuery(api.users.getActiveUsers);

    for (const user of users) {
      try {
        await ctx.runAction(api.sync.syncTimeline, { userId: user._id });
      } catch (error) {
        console.error(`[Cron] Failed to sync timeline for ${user._id}:`, error);
      }
    }
  },
});

// Import api for type checking
import { api } from "./_generated/api";
