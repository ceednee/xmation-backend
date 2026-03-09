/**
 * Action: FOLLOW_USER
 * 
 * Follows a specific user on X (Twitter).
 * 
 * ## Configuration
 * - `userId` (optional) - X user ID to follow
 *   - If not provided, uses authorId from trigger data
 * 
 * ## Context Data
 * - `triggerData.authorId` - User ID to follow (if not in config)
 * 
 * ## Example
 * ```typescript
 * const config = { userId: "123456789" };
 * const result = await followUserExecutor(config, context);
 * ```
 */

import type { ActionExecutor } from "../../types";
import { createResult, getXClient, checkDryRun, getUserId } from "./base";

/**
 * Executes FOLLOW_USER action
 * Follows the specified user using the X API
 * 
 * @param config - Action configuration with optional userId
 * @param context - Action execution context
 * @returns Action result with follow status
 */
export const followUserExecutor: ActionExecutor = async (config, context) => {
	const start = Date.now();
	const dryRunError = checkDryRun(context, "FOLLOW_USER");
	if (dryRunError) {
		return createResult(false, "FOLLOW_USER", Date.now() - start, undefined, dryRunError);
	}

	const xClient = await getXClient(context);
	try {
		const userId = getUserId(config, context.triggerData as Record<string, unknown>);

		if (!userId) {
			return createResult(false, "FOLLOW_USER", Date.now() - start, undefined, "No user ID provided");
		}

		const result = await xClient.followUser(userId) as { data?: { following?: boolean } };
		return createResult(true, "FOLLOW_USER", Date.now() - start, {
			userId,
			following: result.data?.following,
		});
	} catch (error) {
		return createResult(false, "FOLLOW_USER", Date.now() - start, undefined,
			error instanceof Error ? error.message : "Failed to follow user");
	}
};
