/**
 * Like Tweet Action Executor
 * 
 * Likes a tweet on X (Twitter).
 * 
 * ## X API Endpoint
 * 
 * POST /2/users/:id/likes
 * 
 * ## Rate Limit
 * 
 * Free tier: 1000 likes per day
 * 
 * ## Configuration
 * 
 * ```typescript
 * {
 *   tweetId: string;  // Required: Tweet ID to like
 * }
 * ```
 * 
 * ## Usage
 * 
 * ```typescript
 * const result = await likeTweetExecutor(
 *   { tweetId: "1234567890" },
 *   { userId: "u1", xUserId: "x1", dryRun: false, ... }
 * );
 * 
 * if (result.success) {
 *   console.log("Tweet liked successfully");
 * }
 * ```
 */

import type { ActionResult, XApiResponse } from "../../types";
import {
	getXClient,
	checkDryRun,
	createResult,
	ActionContext,
	executeWithRateLimit,
	buildXActionError,
	getTweetId,
} from "./base";

interface LikeTweetConfig {
	tweetId: string;
}

interface LikeResponse {
	liked: boolean;
}

/**
 * Execute LIKE_TWEET action
 * 
 * Likes a tweet by ID.
 * Applies rate limiting and extracts tweet ID from config or trigger data.
 * 
 * @param config - Action configuration
 * @param context - Execution context
 * @returns Action result with like status
 */
export const likeTweetExecutor = async (
	config: Record<string, unknown>,
	context: ActionContext,
): Promise<ActionResult> => {
	const start = Date.now();

	// Check if can execute
	const dryRunError = checkDryRun(context, "LIKE_TWEET");
	if (dryRunError) {
		return createResult(
			false,
			"LIKE_TWEET",
			Date.now() - start,
			{ simulated: true, message: dryRunError },
		);
	}

	// Get tweet ID from config or trigger data
	const tweetId = getTweetId(config, context.triggerData);
	if (!tweetId) {
		return buildXActionError("LIKE_TWEET", "Missing required: tweetId");
	}

	const actionConfig: LikeTweetConfig = { tweetId };

	try {
		const client = await getXClient(context);

		const result = await executeWithRateLimit<LikeResponse>(
			context,
			"LIKE_TWEET",
			async () => {
				const response = await client.likeTweet(actionConfig.tweetId) as XApiResponse;

				if (!response.success) {
					throw new Error(response.error || "Failed to like tweet");
				}

				return response.data as LikeResponse;
			},
		);

		if (!result.success) {
			return createResult(
				false,
				"LIKE_TWEET",
				Date.now() - start,
				undefined,
				result.error,
			);
		}

		return createResult(
			true,
			"LIKE_TWEET",
			Date.now() - start,
			{
				tweetId: actionConfig.tweetId,
				liked: true,
			},
		);
	} catch (error) {
		return buildXActionError("LIKE_TWEET", error as Error);
	}
};
