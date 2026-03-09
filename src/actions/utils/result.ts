/**
 * Action Result Utilities
 * 
 * Helper functions for creating standardized action execution results.
 * Ensures consistent result structure across all action executors.
 */

import type { ActionResult } from "../types";

/**
 * Creates a standardized action result object
 * 
 * This helper ensures all action executors return results with a consistent
 * structure, making it easier to handle results in workflow runners.
 * 
 * @param success - Whether the action completed successfully
 * @param actionType - The type of action that was executed
 * @param executionTimeMs - Time taken to execute in milliseconds
 * @param output - Optional output data from the action
 * @param error - Error message if the action failed
 * @returns A complete ActionResult object
 * 
 * @example
 * ```typescript
 * // Success result
 * return createResult(true, "REPLY_TO_TWEET", 150, { 
 *   tweetId: "123", 
 *   text: "Hello!" 
 * });
 * 
 * // Error result
 * return createResult(false, "SEND_DM", 50, undefined, "User not found");
 * ```
 */
export const createResult = (
	success: boolean,
	actionType: string,
	executionTimeMs: number,
	output?: Record<string, unknown>,
	error?: string,
): ActionResult => ({
	success,
	actionType,
	output,
	error,
	executionTimeMs,
});
