/**
 * Core Action Types
 * 
 * Defines the fundamental types for action execution including results,
 * executors, and action definitions. Actions are operations executed
 * when workflow triggers fire.
 */

/**
 * Result of an action execution
 * 
 * @property success - Whether the action completed successfully
 * @property actionType - The type of action that was executed
 * @property output - Optional output data from the action
 * @property error - Error message if the action failed
 * @property executionTimeMs - Time taken to execute in milliseconds
 */
export interface ActionResult {
	success: boolean;
	actionType: string;
	output?: Record<string, unknown>;
	error?: string;
	executionTimeMs: number;
}

/**
 * Action executor function signature
 * 
 * Implementations receive the action configuration and context,
 * perform the operation, and return a result.
 * 
 * @param config - Action-specific configuration (e.g., { text: "Hello" })
 * @param context - Execution context with user info, trigger data, etc.
 * @returns Promise resolving to action result
 */
export type ActionExecutor = (
	config: Record<string, unknown>,
	context: import("./context").ActionContext,
) => Promise<ActionResult> | ActionResult;

/**
 * Action definition metadata
 * 
 * Used to register actions in the action registry and provide
 * UI information for workflow builders.
 * 
 * @example
 * ```typescript
 * export const replyToTweetDefinition: ActionDefinition = {
 *   type: "REPLY_TO_TWEET",
 *   name: "Reply to Tweet",
 *   description: "Reply to a specific tweet",
 *   executor: replyToTweetExecutor,
 *   requiredConfig: ["text"],
 * }
 * ```
 */
export interface ActionDefinition {
	type: string;
	name: string;
	description: string;
	executor: ActionExecutor;
	defaultConfig?: Record<string, unknown>;
	requiredConfig?: string[];
}
