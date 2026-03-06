import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  // Convex Auth tables (users, sessions, accounts, etc.)
  ...authTables,

  // Extended user table with X OAuth data
  users: defineTable({
    // Auth fields are auto-added by authTables
    
    // X OAuth (encrypted tokens stored separately)
    xUserId: v.optional(v.string()),
    xUsername: v.optional(v.string()),
    xAccessToken: v.optional(v.string()), // Encrypted
    xRefreshToken: v.optional(v.string()), // Encrypted
    xTokenExpiresAt: v.optional(v.number()),
    xScopes: v.optional(v.array(v.string())),
    
    // X Profile (from RapidAPI)
    profile: v.optional(v.object({
      displayName: v.string(),
      avatarUrl: v.string(),
      bio: v.string(),
      followersCount: v.number(),
      followingCount: v.number(),
      verified: v.boolean(),
    })),
    
    // User preferences
    preferences: v.optional(v.object({
      timezone: v.string(),
      dryRunDefault: v.boolean(),
      notificationsEnabled: v.boolean(),
    })),
    
    // Status
    xConnectedAt: v.optional(v.number()),
    lastTokenRefresh: v.optional(v.number()),
  })
    .index("by_xUserId", ["xUserId"])
    .index("by_xUsername", ["xUsername"]),

  // Workflow definitions
  workflows: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("paused")
    ),
    currentVersionId: v.optional(v.string()),
    isDryRun: v.boolean(),
    triggers: v.array(v.object({
      id: v.string(),
      type: v.string(),
      config: v.record(v.string(), v.any()),
      enabled: v.boolean(),
    })),
    actions: v.array(v.object({
      id: v.string(),
      type: v.string(),
      config: v.record(v.string(), v.any()),
      delay: v.optional(v.number()),
      condition: v.optional(v.any()),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_status", ["status"])
    .index("by_userId_status", ["userId", "status"]),

  // Workflow runs
  workflowRuns: defineTable({
    workflowId: v.id("workflows"),
    userId: v.id("users"),
    status: v.union(
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled")
    ),
    mode: v.union(v.literal("live"), v.literal("dry_run")),
    triggerData: v.record(v.string(), v.any()),
    actionsExecuted: v.array(v.object({
      actionId: v.string(),
      actionType: v.string(),
      status: v.union(
        v.literal("pending"),
        v.literal("running"),
        v.literal("completed"),
        v.literal("failed")
      ),
      input: v.record(v.string(), v.any()),
      output: v.optional(v.record(v.string(), v.any())),
      error: v.optional(v.string()),
      startedAt: v.number(),
      completedAt: v.optional(v.number()),
    })),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    error: v.optional(v.string()),
  })
    .index("by_workflowId", ["workflowId"])
    .index("by_userId", ["userId"]),

  // Analytics events
  analyticsEvents: defineTable({
    userId: v.id("users"),
    eventType: v.string(),
    workflowId: v.optional(v.id("workflows")),
    runId: v.optional(v.id("workflowRuns")),
    metadata: v.record(v.string(), v.any()),
    timestamp: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_timestamp", ["userId", "timestamp"])
    .index("by_eventType", ["eventType"]),
});
