/**
 * Simple Action Handlers
 * 
 * Factory for creating handlers for simple actions that don't require
 * complex logic or API interactions. These actions are handled uniformly.
 * 
 * @module action-dispatcher/handlers/simple
 */

import type { ActionContext, ActionExecutionResult } from "../types";
import { createSuccessResult } from "../result";

/**
 * List of action types that use the simple handler factory.
 * These actions have uniform handling and don't require custom logic.
 */
export const SIMPLE_ACTIONS = [
	"FOLLOW_BACK",
	"RETWEET",
	"QUOTE_TWEET",
	"PIN_TWEET",
	"THANK_YOU_REPLY",
	"ADD_TO_LIST",
	"BLOCK_USER",
	"REPORT_SPAM",
	"ALERT_ADMIN",
] as const;

/**
 * Create a simple handler for the specified action type.
 * 
 * Simple handlers return success results with minimal processing.
 * In dry run mode, they return simulated results.
 * 
 * @param actionType - The type of action this handler will process
 * @returns A handler function for the specified action type
 * 
 * @example
 * ```typescript
 * const retweetHandler = createSimpleHandler("RETWEET");
 * const result = await retweetHandler({}, { userId: "user_1", triggerData: {} });
 * ```
 */
export const createSimpleHandler = (actionType: string) => async (
	_config: Record<string, unknown>,
	context: ActionContext
): Promise<ActionExecutionResult> => {
	if (context.dryRun) {
		return createSuccessResult(
			actionType,
			"dry_run",
			{ simulated: true },
			0,
			true
		);
	}

	return createSuccessResult(
		actionType,
		actionType.toLowerCase() + "_" + Date.now(),
		{ completed: true },
		100
	);
};
