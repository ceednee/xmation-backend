import type { ActionContext, ActionExecutionResult } from "../types";
import { createSuccessResult, createErrorResult } from "../result";

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
