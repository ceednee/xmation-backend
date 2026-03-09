/**
 * Reply to Tweet Action Executor
 * 
 * Replies to a specific tweet on X (Twitter).
 * Supports template variable substitution in the reply text.
 * 
 * ## Configuration
 * 
 * - `text` (required) - The reply text content
 * - `tweetId` (optional) - Specific tweet to reply to
 *   - If not provided, uses tweetId from trigger data
 * 
 * ## Template Variables
 * 
 * - `{{authorUsername}}` - Username of the tweet author
 * - Other trigger data fields can be referenced
 * 
 * ## Context Data
 * 
 * - `triggerData.tweetId` - ID of tweet to reply to
 * - `triggerData.mentionId` - Alternative ID source
 * 
 * ## Example
 * 
 * ```typescript
 * const config = {
 *   text: "Thanks @{{authorUsername}}! 🙏"
 * };
 * const result = await replyToTweetExecutor(config, context);
 * ```
 */

import type { ActionExecutor } from "../../types";
import { createResult, replaceTemplates, getXClient, checkDryRun, getTweetId } from "./base";

/**
 * Executes REPLY_TO_TWEET action
 * Posts a reply to the specified tweet
 */
export const replyToTweetExecutor: ActionExecutor = async (config, context) => {
	const start = Date.now();
	const dryRunError = checkDryRun(context, "REPLY_TO_TWEET");
	if (dryRunError) {
		return createResult(false, "REPLY_TO_TWEET", Date.now() - start, undefined, dryRunError);
	}

	const xClient = await getXClient(context);
	try {
		const text = replaceTemplates(String(config.text ?? ""), context);
		const tweetId = getTweetId(config, context.triggerData as Record<string, unknown>);

		if (!tweetId) {
			return createResult(false, "REPLY_TO_TWEET", Date.now() - start, undefined, "No tweet ID provided");
		}

		const result = await xClient.replyToTweet(tweetId, text) as { data?: { id?: string } };
		return createResult(true, "REPLY_TO_TWEET", Date.now() - start, {
			tweetId: result.data?.id,
			text,
			repliedTo: tweetId,
		});
	} catch (error) {
		return createResult(false, "REPLY_TO_TWEET", Date.now() - start, undefined,
			error instanceof Error ? error.message : "Failed to reply");
	}
};
