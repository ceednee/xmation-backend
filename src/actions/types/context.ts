/**
 * Action Execution Context Types
 * 
 * Defines the context object passed to all action executors.
 * This context provides the execution environment including user info,
 * workflow metadata, trigger data, and execution mode.
 */

import type { ActionResult } from "./core";

/**
 * Data passed from the trigger that activated the workflow
 * Contains information about the event (e.g., mention details, follower info)
 */
export interface TriggerData {
	[key: string]: unknown;
}

/**
 * Context object provided to action executors
 * 
 * Contains all information needed to execute an action:
 * - User identity (userId, xUserId)
 * - Workflow execution metadata (workflowId, runId)
 * - Trigger event data
 * - Execution mode (dryRun)
 * - Previous action results (for sequential actions)
 * 
 * @example
 * ```typescript
 * const context: ActionContext = {
 *   userId: "user_123",
 *   xUserId: "x_user_456",
 *   workflowId: "wf_789",
 *   runId: "run_abc",
 *   triggerData: { mentionId: "tweet_123", authorId: "user_456" },
 *   dryRun: false,
 * }
 * ```
 */
export interface ActionContext {
	/** Internal user ID from Convex */
	userId: string;
	/** X (Twitter) user ID if account is connected */
	xUserId?: string;
	/** Workflow that is being executed */
	workflowId: string;
	/** Unique identifier for this workflow run */
	runId: string;
	/** Data from the trigger event that activated the workflow */
	triggerData: Record<string, TriggerData>;
	/** Results from previously executed actions in this workflow run */
	previousResults?: ActionResult[];
	/** Whether to simulate execution without making real API calls */
	dryRun: boolean;
}
