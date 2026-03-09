/**
 * Action: FOLLOW_BACK
 * 
 * Automatically follows back a new follower on X (Twitter).
 * Typically used in response to a "new follower" trigger.
 * 
 * ## Configuration
 * - No configuration required
 * 
 * ## Context Data
 * - `triggerData.followerId` (required) - ID of the user to follow back
 * 
 * ## Trigger
 * Best used with triggers:
 * - `NEW_FOLLOWER` - When someone follows your account
 * 
 * ## Example
 * ```typescript
 * // No configuration needed
 * const config = {};
 * const result = await followBackExecutor(config, context);
 * // context.triggerData.followerId must be set
 * ```
 */

import type { ActionExecutor } from "../../types";
import { createResult, getXClient, checkDryRun } from "./base";

/**
 * Executes FOLLOW_BACK action
 * Follows back the user who triggered the workflow
 * 
 * @param config - Action configuration (unused)
 * @param context - Action execution context with followerId in triggerData
 * @returns Action result with follow status
 */
export const followBackExecutor: ActionExecutor = async (_config, context) => {
	const start = Date.now();
	const dryRunError = checkDryRun(context, "FOLLOW_BACK");
	if (dryRunError) {
		return createResult(false, "FOLLOW_BACK", Date.now() - start, undefined, dryRunError);
	}

	const xClient = await getXClient(context);
	try {
		const triggerData = context.triggerData as Record<string, unknown>;
		const userId = String(triggerData.followerId || "");

		if (!userId) {
			return createResult(false, "FOLLOW_BACK", Date.now() - start, undefined, "No follower ID provided");
		}

		const result = await xClient.followUser(userId) as { data?: { following?: boolean } };
		return createResult(true, "FOLLOW_BACK", Date.now() - start, {
			userId,
			following: result.data?.following,
		});
	} catch (error) {
		return createResult(false, "FOLLOW_BACK", Date.now() - start, undefined,
			error instanceof Error ? error.message : "Failed to follow back");
	}
};
