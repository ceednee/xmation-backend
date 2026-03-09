/**
 * Action: BLOCK_USER
 * 
 * Blocks a user on X (Twitter), preventing them from:
 * - Following your account
 * - Viewing your tweets (when logged in)
 * - Sending you direct messages
 * 
 * ## Configuration
 * - `userId` (optional) - X user ID to block
 *   - If not provided, uses authorId from trigger data
 * 
 * ## Context Data
 * - `triggerData.authorId` - User ID to block (if not in config)
 * 
 * ## Example
 * ```typescript
 * const config = { userId: "123456789" };
 * const result = await blockUserExecutor(config, context);
 * ```
 */

import type { ActionExecutor } from "../../types";
import { createResult, getXClient, checkDryRun, getUserId } from "./base";

/**
 * Executes BLOCK_USER action
 * Blocks the specified user using the X API
 * 
 * @param config - Action configuration with optional userId
 * @param context - Action execution context
 * @returns Action result with block status
 */
export const blockUserExecutor: ActionExecutor = async (config, context) => {
	const start = Date.now();
	const dryRunError = checkDryRun(context, "BLOCK_USER");
	if (dryRunError) {
		return createResult(false, "BLOCK_USER", Date.now() - start, undefined, dryRunError);
	}

	const xClient = await getXClient(context);
	try {
		const userId = getUserId(config, context.triggerData as Record<string, unknown>);

		if (!userId) {
			return createResult(false, "BLOCK_USER", Date.now() - start, undefined, "No user ID provided");
		}

		const result = await xClient.blockUser(userId) as { data?: { blocked?: boolean } };
		return createResult(true, "BLOCK_USER", Date.now() - start, {
			userId,
			blocked: result.data?.blocked,
		});
	} catch (error) {
		return createResult(false, "BLOCK_USER", Date.now() - start, undefined,
			error instanceof Error ? error.message : "Failed to block user");
	}
};
