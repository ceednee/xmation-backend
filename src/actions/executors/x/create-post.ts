/**
 * Create Post Action Executor
 * 
 * Creates a new tweet/post on X (Twitter).
 * Supports plain text, replies, quotes, and media attachments.
 * 
 * ## X API Endpoint
 * 
 * POST /2/tweets
 * 
 * ## Rate Limit
 * 
 * Free tier: 500 posts per month
 * 
 * ## Configuration
 * 
 * ```typescript
 * {
 *   text: string;           // Required: Tweet content
 *   replyTo?: string;       // Optional: Tweet ID to reply to
 *   quoteTweetId?: string;  // Optional: Tweet ID to quote
 *   mediaIds?: string[];    // Optional: Media IDs to attach
 * }
 * ```
 * 
 * ## Usage
 * 
 * ```typescript
 * const result = await createPostExecutor(
 *   { text: "Hello world!" },
 *   { userId: "u1", xUserId: "x1", dryRun: false, ... }
 * );
 * 
 * if (result.success) {
 *   console.log("Tweet posted:", result.output?.tweetId);
 * }
 * ```
 */

import type { ActionResult, XApiResponse } from "../../types";
import {
	getXClient,
	checkDryRun,
	createResult,
	replaceTemplates,
	ActionContext,
	executeWithRateLimit,
	buildXActionError,
} from "./base";

interface CreatePostConfig {
	text: string;
	replyTo?: string;
	quoteTweetId?: string;
	mediaIds?: string[];
}

interface TweetResponse {
	id: string;
	text: string;
}

/**
 * Execute CREATE_POST action
 * 
 * Creates a new tweet with optional reply, quote, or media.
 * Applies rate limiting and template variable replacement.
 * 
 * @param config - Action configuration
 * @param context - Execution context
 * @returns Action result with tweet details
 */
export const createPostExecutor = async (
	config: Record<string, unknown>,
	context: ActionContext,
): Promise<ActionResult> => {
	const start = Date.now();

	// Check if can execute
	const dryRunError = checkDryRun(context, "CREATE_POST");
	if (dryRunError) {
		return createResult(
			false,
			"CREATE_POST",
			Date.now() - start,
			{ simulated: true, message: dryRunError },
		);
	}

	// Validate config
	if (!config.text || typeof config.text !== "string") {
		return buildXActionError("CREATE_POST", "Missing required config: text");
	}

	const actionConfig: CreatePostConfig = {
		text: replaceTemplates(config.text, context),
		replyTo: config.replyTo as string | undefined,
		quoteTweetId: config.quoteTweetId as string | undefined,
		mediaIds: config.mediaIds as string[] | undefined,
	};

	try {
		const client = await getXClient(context);

		const result = await executeWithRateLimit<TweetResponse>(
			context,
			"CREATE_POST",
			async () => {
				const body: Record<string, unknown> = { text: actionConfig.text };

				if (actionConfig.replyTo) {
					body.reply = {
						in_reply_to_tweet_id: actionConfig.replyTo,
					};
				}

				if (actionConfig.quoteTweetId) {
					body.quote_tweet_id = actionConfig.quoteTweetId;
				}

				if (actionConfig.mediaIds?.length) {
					body.media = { media_ids: actionConfig.mediaIds };
				}

				const response = await client.createTweet(actionConfig.text, {
					reply: actionConfig.replyTo
						? { in_reply_to_tweet_id: actionConfig.replyTo }
						: undefined,
					quote_tweet_id: actionConfig.quoteTweetId,
				}) as XApiResponse;

				if (!response.success) {
					throw new Error(response.error || "Failed to create tweet");
				}

				return response.data as TweetResponse;
			},
		);

		if (!result.success) {
			return createResult(
				false,
				"CREATE_POST",
				Date.now() - start,
				undefined,
				result.error,
			);
		}

		return createResult(
			true,
			"CREATE_POST",
			Date.now() - start,
			{
				tweetId: result.data?.id,
				text: actionConfig.text,
				url: `https://x.com/i/web/status/${result.data?.id}`,
			},
		);
	} catch (error) {
		return buildXActionError("CREATE_POST", error as Error);
	}
};
