/**
 * Action: PIN_TWEET
 * 
 * Pins a tweet to the top of your X (Twitter) profile.
 * Only one tweet can be pinned at a time; pinning a new tweet replaces the previous one.
 * 
 * ## Configuration
 * - `tweetId` (optional) - ID of the tweet to pin
 *   - If not provided, uses tweetId from trigger data
 *   - Falls back to topPost.id from trigger data (for top performing content)
 * 
 * ## Context Data
 * - `triggerData.tweetId` - Tweet ID to pin
 * - `triggerData.topPost.id` - Alternative for pinning top performing content
 * 
 * ## Example
 * ```typescript
 * const config = { tweetId: "1234567890123456789" };
 * const result = await pinTweetExecutor(config, context);
 * ```
 */

import type { ActionExecutor } from "../../types";
import { createResult, getXClient, checkDryRun } from "./base";

/**
 * Executes PIN_TWEET action
 * Pins the specified tweet to the user's profile
 * 
 * @param config - Action configuration with optional tweetId
 * @param context - Action execution context
 * @returns Action result with pin status
 */
export const pinTweetExecutor: ActionExecutor = async (config, context) => {
	const start = Date.now();
	const dryRunError = checkDryRun(context, "PIN_TWEET");
	if (dryRunError) {
		return createResult(false, "PIN_TWEET", Date.now() - start, undefined, dryRunError);
	}

	const xClient = await getXClient(context);
	try {
		const triggerData = context.triggerData as Record<string, unknown>;
		const topPost = triggerData.topPost as { id?: string } | undefined;
		const tweetId = String(config.tweetId || triggerData.tweetId || topPost?.id || "");

		if (!tweetId) {
			return createResult(false, "PIN_TWEET", Date.now() - start, undefined, "No tweet ID provided");
		}

		const result = await xClient.pinTweet(tweetId);
		const resultData = result as { pinned?: boolean };
		return createResult(true, "PIN_TWEET", Date.now() - start, { tweetId, pinned: resultData.pinned });
	} catch (error) {
		return createResult(false, "PIN_TWEET", Date.now() - start, undefined,
			error instanceof Error ? error.message : "Failed to pin tweet");
	}
};
