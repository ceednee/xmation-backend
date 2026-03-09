/**
 * Reply Action Handler
 * 
 * Handles the REPLY_TO_TWEET action type for replying to tweets.
 * Supports dry run mode, rate limit simulation, and error simulation for testing.
 * 
 * @module action-dispatcher/handlers/reply
 */

import type { ActionContext, ActionExecutionResult } from "../types";
import { createSuccessResult, createErrorResult } from "../result";

/**
 * Handle replying to a tweet.
 * 
 * Supports multiple execution modes:
 * - Dry run: Returns simulated success without API call
 * - Rate limit simulation: Returns error with retryAfter
 * - Error simulation: Returns error with specified message
 * - Normal: Would post reply via X API (currently simulated)
 * 
 * @param config - Action configuration containing text and tweetId
 * @param context - Execution context with dryRun, simulateRateLimit, simulateError flags
 * @returns Promise resolving to the execution result
 * 
 * @example
 * ```typescript
 * // Normal execution
 * const result = await handleReplyToTweet(
 *   { text: "Thanks!", tweetId: "123" },
 *   { userId: "user_1", triggerData: {} }
 * );
 * 
 * // Dry run
 * const dryRunResult = await handleReplyToTweet(
 *   { text: "Test" },
 *   { userId: "user_1", triggerData: {}, dryRun: true }
 * );
 * 
 * // Simulate rate limit
 * const rateLimitResult = await handleReplyToTweet(
 *   { text: "Test" },
 *   { userId: "user_1", triggerData: {}, simulateRateLimit: true }
 * );
 * ```
 */
export const handleReplyToTweet = async (
	config: Record<string, unknown>,
	context: ActionContext
): Promise<ActionExecutionResult> => {
	if (context.dryRun) {
		return createSuccessResult(
			"REPLY_TO_TWEET",
			"dry_run",
			{ text: config.text, simulated: true },
			0,
			true
		);
	}

	if (context.simulateRateLimit) {
		return createErrorResult(
			"REPLY_TO_TWEET",
			"api_call",
			"Rate limit exceeded",
			0,
			900
		);
	}

	if (context.simulateError) {
		return createErrorResult(
			"REPLY_TO_TWEET",
			"api_call",
			context.simulateError.message,
			0
		);
	}

	return createSuccessResult(
		"REPLY_TO_TWEET",
		"tweet_" + Date.now(),
		{ text: config.text, tweetId: "reply_" + Date.now() },
		100
	);
};
