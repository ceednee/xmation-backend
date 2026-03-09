/**
 * Action Dispatcher Types
 * 
 * Defines types for action dispatching including results, context,
 * and handler functions. The action dispatcher routes actions to
 * their appropriate handlers and manages execution.
 */

import type { ActionConfig } from "../../types";

/**
 * Result of action execution
 * 
 * @property success - Whether the action completed successfully
 * @property actionType - Type of action that was executed
 * @property actionId - Unique identifier for this action config
 * @property output - Optional output data from the action
 * @property error - Error message if action failed
 * @property retryAfter - Seconds to wait before retry (rate limit)
 * @property dryRun - Whether this was a simulated execution
 * @property executionTime - Time taken in milliseconds
 * @property completedAt - Unix timestamp when action completed
 */
export interface ActionExecutionResult {
	success: boolean;
	actionType: string;
	actionId: string;
	output?: Record<string, unknown>;
	error?: string;
	retryAfter?: number;
	dryRun?: boolean;
	executionTime: number;
	completedAt: number;
}

/**
 * Context for action execution
 * 
 * Provides execution context including user identity,
 * authentication tokens, and trigger data.
 */
export interface ActionContext {
	/** User ID executing the workflow */
	userId: string;
	/** X API access token (if connected) */
	xAccessToken?: string;
	/** Data from the trigger event */
	triggerData: Record<string, unknown>;
	/** Whether to simulate without making real API calls */
	dryRun?: boolean;
	/** For testing: simulate rate limit response */
	simulateRateLimit?: boolean;
	/** For testing: simulate error response */
	simulateError?: Error;
}

/**
 * Action handler function signature
 * 
 * Handlers receive action configuration and context,
 * execute the action, and return a result.
 * 
 * @param config - Action-specific configuration
 * @param context - Execution context
 * @returns Promise resolving to execution result
 */
export type ActionHandler = (
	config: Record<string, unknown>,
	context: ActionContext
) => Promise<ActionExecutionResult>;

/**
 * Configuration for action dispatcher
 */
export interface ActionDispatcherConfig {
	action: ActionConfig;
	context: ActionContext;
	startTime: number;
}

/**
 * @deprecated Use ActionContext instead
 */
export type DispatchContext = ActionContext;

/**
 * @deprecated Use ActionExecutionResult instead
 */
export type DispatchResult = ActionExecutionResult;
