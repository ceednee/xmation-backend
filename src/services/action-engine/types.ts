/**
 * Action Engine Types
 * 
 * Type definitions for the action execution engine.
 */

import type { ActionResult } from "../../actions/types";
import type { ActionConfig, Workflow } from "../../types";

// Re-export TriggerData for compatibility
export interface TriggerData {
	[key: string]: unknown;
}

/**
 * Result of executing a complete workflow.
 */
export interface WorkflowExecutionResult {
	/** Workflow ID that was executed */
	workflowId: string;
	/** Unique execution run ID */
	runId: string;
	/** Whether all actions succeeded */
	success: boolean;
	/** Results from each action */
	actions: ActionResult[];
	/** Timestamp when execution started */
	startedAt: number;
	/** Timestamp when execution completed */
	completedAt: number;
	/** Error message if workflow failed */
	error?: string;
}

/**
 * A condition for conditional action execution.
 */
export interface Condition {
	/** Field name in trigger data to check */
	field: string;
	/** Comparison operator (eq, ne, gt, lt, gte, lte, contains) */
	operator: string;
	/** Value to compare against */
	value: unknown;
}

/**
 * Minimal context with just user information.
 * Used as a starting point for building full context.
 */
export interface BaseActionContext {
	/** Internal user ID */
	userId: string;
	/** X (Twitter) user ID */
	xUserId: string | undefined;
	/** Whether to simulate execution (don't make actual API calls) */
	dryRun: boolean;
}

/**
 * Full context passed to action executors.
 * Contains all information needed to execute an action.
 */
export interface ActionContext extends BaseActionContext {
	/** Workflow being executed */
	workflowId: string;
	/** Unique execution run ID */
	runId: string;
	/** Data that triggered the workflow (mentions, followers, etc.) */
	triggerData: Record<string, TriggerData>;
	/** Results from previously executed actions in this workflow */
	previousResults: ActionResult[];
}

/**
 * Parameters for workflow execution.
 */
export interface WorkflowExecutor {
	/** Workflow to execute */
	workflow: Workflow;
	/** Data that triggered the workflow */
	triggerData: Record<string, unknown>;
	/** Base execution context */
	context: BaseActionContext;
}
