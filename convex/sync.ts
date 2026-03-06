import { query, mutation, action, cron } from "./_generated/server";
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
 * Cron job: Sync mentions every 5 minutes
 */
export const mentionsCron = cron({
  name: "Sync mentions",
  schedule: "0/5 * * * *", // Every 5 minutes
  handler: async (ctx) => {
    // Get all active users
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
 * Cron job: Sync followers every 30 minutes
 */
export const followersCron = cron({
  name: "Sync followers",
  schedule: "0/30 * * * *", // Every 30 minutes
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
 * Cron job: Sync timeline every 15 minutes
 */
export const timelineCron = cron({
  name: "Sync timeline",
  schedule: "0/15 * * * *", // Every 15 minutes
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

// Import api for type checking
import { api } from "./_generated/api";
