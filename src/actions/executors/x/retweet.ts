/**
 * Action: RETWEET
 * 
 * Retweets a specific tweet on X (Twitter).
 * 
 * ## Configuration
 * - `tweetId` (optional) - ID of the tweet to retweet
 *   - If not provided, uses tweetId from trigger data
 *   - Falls back to retweetId from trigger data
 * 
 * ## Context Data
 * - `triggerData.tweetId` - Tweet ID to retweet
 * - `triggerData.retweetId` - Alternative tweet ID source
 * 
 * ## Example
 * ```typescript
 * const config = { tweetId: "1234567890123456789" };
 * const result = await retweetExecutor(config, context);
 * ```
 */

import type { ActionExecutor } from "../../types";
import { createResult, getXClient, checkDryRun } from "./base";

/**
 * Executes RETWEET action
 * Retweets the specified tweet using the X API
 * 
 * @param config - Action configuration with optional tweetId
 * @param context - Action execution context
 * @returns Action result with retweet details
 */
export const retweetExecutor: ActionExecutor = async (config, context) => {
	const start = Date.now();
	const dryRunError = checkDryRun(context, "RETWEET");
	if (dryRunError) {
		return createResult(false, "RETWEET", Date.now() - start, undefined, dryRunError);
	}

	const xClient = await getXClient(context);
	try {
		const triggerData = context.triggerData as Record<string, unknown>;
		const tweetId = String(config.tweetId || triggerData.tweetId || triggerData.retweetId || "");

		if (!tweetId) {
			return createResult(false, "RETWEET", Date.now() - start, undefined, "No tweet ID provided");
		}

		const result = await xClient.retweet(tweetId) as { data?: { id?: string } };
		return createResult(true, "RETWEET", Date.now() - start, {
			retweetId: result.data?.id,
			originalTweetId: tweetId,
		});
	} catch (error) {
		return createResult(false, "RETWEET", Date.now() - start, undefined,
			error instanceof Error ? error.message : "Failed to retweet");
	}
};
