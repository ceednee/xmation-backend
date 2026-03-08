import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Workflow Convex Functions
 * 
 * These functions provide CRUD operations for workflows
 * with proper authorization and data persistence.
 */

/**
 * Get all workflows for the current user
 */
export const list = query({
  handler: async (ctx) => {
    const userId = await ctx.auth.getUserIdentity();
    
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const workflows = await ctx.db
      .query("workflows")
      .withIndex("by_userId")
      .filter((q) => q.eq(q.field("userId"), userId.subject))
      .collect();

    return workflows;
  },
});

/**
 * Get a single workflow by ID
 */
export const get = query({
  args: {
    id: v.id("workflows"),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const workflow = await ctx.db.get(args.id);
    
    if (!workflow) {
      return null;
    }

    // Verify ownership
    if (workflow.userId !== userId.subject) {
      throw new Error("Access denied");
    }

    return workflow;
  },
});

/**
 * Create a new workflow
 */
export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    status: v.optional(v.union(v.literal("draft"), v.literal("active"), v.literal("paused"))),
    triggers: v.optional(v.array(v.object({
      id: v.string(),
      type: v.string(),
      config: v.record(v.string(), v.any()),
      enabled: v.boolean(),
    }))),
    actions: v.optional(v.array(v.object({
      id: v.string(),
      type: v.string(),
      config: v.record(v.string(), v.any()),
      delay: v.optional(v.number()),
      condition: v.optional(v.any()),
    }))),
    isDryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();
    
    const workflowId = await ctx.db.insert("workflows", {
      userId: userId.subject as any,
      name: args.name,
      description: args.description,
      status: args.status || "draft",
      triggers: args.triggers || [],
      actions: args.actions || [],
      isDryRun: args.isDryRun ?? true,
      createdAt: now,
      updatedAt: now,
    });

    return { id: workflowId };
  },
});

/**
 * Update a workflow
 */
export const update = mutation({
  args: {
    id: v.id("workflows"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.union(v.literal("draft"), v.literal("active"), v.literal("paused"))),
    triggers: v.optional(v.array(v.object({
      id: v.string(),
      type: v.string(),
      config: v.record(v.string(), v.any()),
      enabled: v.boolean(),
    }))),
    actions: v.optional(v.array(v.object({
      id: v.string(),
      type: v.string(),
      config: v.record(v.string(), v.any()),
      delay: v.optional(v.number()),
      condition: v.optional(v.any()),
    }))),
    isDryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const workflow = await ctx.db.get(args.id);
    
    if (!workflow) {
      throw new Error("Workflow not found");
    }

    // Verify ownership
    if (workflow.userId !== userId.subject) {
      throw new Error("Access denied");
    }

    // Build update object with only provided fields
    const update: Record<string, unknown> = {
      updatedAt: Date.now(),
    };
    
    if (args.name !== undefined) update.name = args.name;
    if (args.description !== undefined) update.description = args.description;
    if (args.status !== undefined) update.status = args.status;
    if (args.triggers !== undefined) update.triggers = args.triggers;
    if (args.actions !== undefined) update.actions = args.actions;
    if (args.isDryRun !== undefined) update.isDryRun = args.isDryRun;

    await ctx.db.patch(args.id, update);

    return { success: true };
  },
});

/**
 * Delete a workflow
 */
export const remove = mutation({
  args: {
    id: v.id("workflows"),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const workflow = await ctx.db.get(args.id);
    
    if (!workflow) {
      throw new Error("Workflow not found");
    }

    // Verify ownership
    if (workflow.userId !== userId.subject) {
      throw new Error("Access denied");
    }

    await ctx.db.delete(args.id);

    return { success: true };
  },
});

/**
 * Activate a workflow
 */
export const activate = mutation({
  args: {
    id: v.id("workflows"),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const workflow = await ctx.db.get(args.id);
    
    if (!workflow) {
      throw new Error("Workflow not found");
    }

    // Verify ownership
    if (workflow.userId !== userId.subject) {
      throw new Error("Access denied");
    }

    // Validate workflow can be activated
    if (workflow.triggers.length === 0) {
      throw new Error("Workflow must have at least one trigger");
    }

    await ctx.db.patch(args.id, {
      status: "active",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Pause a workflow
 */
export const pause = mutation({
  args: {
    id: v.id("workflows"),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const workflow = await ctx.db.get(args.id);
    
    if (!workflow) {
      throw new Error("Workflow not found");
    }

    // Verify ownership
    if (workflow.userId !== userId.subject) {
      throw new Error("Access denied");
    }

    await ctx.db.patch(args.id, {
      status: "paused",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Test a workflow (dry run)
 */
export const test = mutation({
  args: {
    id: v.id("workflows"),
    triggerData: v.optional(v.record(v.string(), v.any())),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const workflow = await ctx.db.get(args.id);
    
    if (!workflow) {
      throw new Error("Workflow not found");
    }

    // Verify ownership
    if (workflow.userId !== userId.subject) {
      throw new Error("Access denied");
    }

    // Create a test run
    const runId = await ctx.db.insert("workflowRuns", {
      workflowId: args.id,
      userId: userId.subject as any,
      status: "completed",
      mode: "dry_run",
      triggerData: args.triggerData || {},
      actionsExecuted: workflow.actions.map((action, index) => ({
        actionId: action.id,
        actionType: action.type,
        status: "completed" as const,
        input: action.config,
        output: { simulated: true, message: "Dry run completed" },
        startedAt: Date.now() + (action.delay || 0) * 1000 * index,
        completedAt: Date.now() + (action.delay || 0) * 1000 * index + 100,
      })),
      startedAt: Date.now(),
      completedAt: Date.now(),
    });

    return { 
      success: true, 
      runId,
      mode: "dry_run",
      actionsExecuted: workflow.actions.length,
    };
  },
});

/**
 * Get active workflows for a user (for cron processing)
 */
export const getActive = query({
  handler: async (ctx) => {
    const userId = await ctx.auth.getUserIdentity();
    
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const workflows = await ctx.db
      .query("workflows")
      .withIndex("by_userId_status")
      .filter((q) => 
        q.eq(q.field("userId"), userId.subject) && 
        q.eq(q.field("status"), "active")
      )
      .collect();

    return workflows;
  },
});
