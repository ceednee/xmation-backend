/**
 * Direct Message Action Handler
 * 
 * Handles the SEND_DM action type for sending direct messages.
 * Supports dry run mode for testing.
 * 
 * @module action-dispatcher/handlers/dm
 */

import type { ActionContext, ActionExecutionResult } from "../types";
import { createSuccessResult } from "../result";

/**
 * Handle sending a direct message.
 * 
 * In dry run mode, returns a simulated success result without making API calls.
 * In live mode, would send the DM via the X API (currently simulated).
 * 
 * @param config - Action configuration containing text and recipientId
 * @param context - Execution context including dryRun flag
 * @returns Promise resolving to the execution result
 * 
 * @example
 * ```typescript
 * const result = await handleSendDM(
 *   { text: "Hello!", recipientId: "123456" },
 *   { userId: "user_1", triggerData: {}, dryRun: false }
 * );
 * ```
 */
export const handleSendDM = async (
	config: Record<string, unknown>,
	context: ActionContext
): Promise<ActionExecutionResult> => {
	if (context.dryRun) {
		return createSuccessResult(
			"SEND_DM",
			"dry_run",
			{ text: config.text, simulated: true },
			0,
			true
		);
	}

	return createSuccessResult(
		"SEND_DM",
		"dm_" + Date.now(),
		{
			text: config.text,
			recipientId: config.recipientId,
			dmId: "dm_" + Date.now(),
		},
		150
	);
};
