/**
 * Log Action Handler
 * 
 * Handles the LOG_EVENT action type for logging events.
 * Outputs to console and returns execution result.
 * 
 * @module action-dispatcher/handlers/log
 */

import type { ActionContext, ActionExecutionResult } from "../types";
import { createSuccessResult } from "../result";

/**
 * Handle logging an event.
 * 
 * Outputs the event and metadata to the console, then returns a success result.
 * Useful for debugging and audit trails in workflows.
 * 
 * @param config - Action configuration containing event and metadata
 * @param _context - Execution context (unused but required by handler signature)
 * @returns Promise resolving to the execution result
 * 
 * @example
 * ```typescript
 * const result = await handleLogEvent(
 *   { event: "User signed up", metadata: { userId: "123" } },
 *   { userId: "user_1", triggerData: {} }
 * );
 * // Console output: [LOG_EVENT] User signed up { userId: "123" }
 * ```
 */
export const handleLogEvent = async (
	config: Record<string, unknown>,
	_context: ActionContext
): Promise<ActionExecutionResult> => {
	console.log("[LOG_EVENT]", config.event, config.metadata);

	return createSuccessResult(
		"LOG_EVENT",
		"log_" + Date.now(),
		{ event: config.event, logged: true },
		10
	);
};
