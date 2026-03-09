/**
 * Action: QUOTE_TWEET
 * 
 * Creates a quote tweet (retweet with comment) on X (Twitter).
 * Supports template variable substitution in the comment text.
 * 
 * ## Configuration
 * - `comment` (required) - The quote tweet text content
 * - `tweetId` (optional) - Specific tweet to quote
 *   - If not provided, uses tweetId from trigger data
 * 
 * ## Template Variables
 * - `{{authorUsername}}` - Username of the tweet author
 * - Other trigger data fields can be referenced
 * 
 * ## Context Data
 * - `triggerData.tweetId` - ID of tweet to quote
 * 
 * ## Example
 * ```typescript
 * const config = {
 *   comment: "Great point by @{{authorUsername}}! 👏"
 * };
 * const result = await quoteTweetExecutor(config, context);
 * ```
 */

import type { ActionExecutor } from "../../types";
import { createResult, replaceTemplates, getXClient, checkDryRun } from "./base";

/**
 * Executes QUOTE_TWEET action
 * Creates a quote tweet with the specified comment
 * 
 * @param config - Action configuration with comment and optional tweetId
 * @param context - Action execution context
 * @returns Action result with created quote tweet details
 */
export const quoteTweetExecutor: ActionExecutor = async (config, context) => {
	const start = Date.now();
	const dryRunError = checkDryRun(context, "QUOTE_TWEET");
	if (dryRunError) {
		return createResult(false, "QUOTE_TWEET", Date.now() - start, undefined, dryRunError);
	}

	const xClient = await getXClient(context);
	try {
		const comment = replaceTemplates(String(config.comment ?? ""), context);
		const triggerData = context.triggerData as Record<string, unknown>;
		const tweetId = String(config.tweetId || triggerData.tweetId || "");

		if (!tweetId) {
			return createResult(false, "QUOTE_TWEET", Date.now() - start, undefined, "No tweet ID provided");
		}

		const result = await xClient.quoteTweet(tweetId, comment) as { data?: { id?: string } };
		return createResult(true, "QUOTE_TWEET", Date.now() - start, {
			quoteId: result.data?.id,
			comment,
			originalTweetId: tweetId,
		});
	} catch (error) {
		return createResult(false, "QUOTE_TWEET", Date.now() - start, undefined,
			error instanceof Error ? error.message : "Failed to quote tweet");
	}
};
