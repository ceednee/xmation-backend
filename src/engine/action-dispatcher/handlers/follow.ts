/**
 * Follow Action Handler
 * 
 * Handles the FOLLOW_USER action type for following users.
 * Supports dry run mode for testing.
 * 
 * @module action-dispatcher/handlers/follow
 */

import type { ActionContext, ActionExecutionResult } from "../types";
import { createSuccessResult } from "../result";

/**
 * Handle following a user.
 * 
 * In dry run mode, returns a simulated success result without making API calls.
 * In live mode, would follow the user via the X API (currently simulated).
 * 
 * @param config - Action configuration containing userId to follow
 * @param context - Execution context including dryRun flag
 * @returns Promise resolving to the execution result
 * 
 * @example
 * ```typescript
 * const result = await handleFollowUser(
 *   { userId: "123456" },
 *   { userId: "user_1", triggerData: {}, dryRun: false }
 * );
 * ```
 */
export const handleFollowUser = async (
	config: Record<string, unknown>,
	context: ActionContext
): Promise<ActionExecutionResult> => {
	if (context.dryRun) {
		return createSuccessResult(
			"FOLLOW_USER",
			"dry_run",
			{ userId: config.userId, simulated: true },
			0,
			true
		);
	}

	return createSuccessResult(
		"FOLLOW_USER",
		"follow_" + Date.now(),
		{ userId: config.userId, followed: true },
		200
	);
};
