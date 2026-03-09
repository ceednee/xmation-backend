/**
 * Trigger Evaluator: NEW_REPLY
 * 
 * Detects when someone replies to the user's tweets.
 * Filters replies from the last 60 seconds to avoid re-triggering.
 * 
 * ## Configuration
 * No configuration options (evaluates all new replies)
 * 
 * ## Trigger Data
 * - `replies` - Array of recent replies to user's tweets
 * - `currentTime` - Current timestamp for recency check
 * 
 * ## Returns
 * - `triggered` - True if any replies in last 60 seconds
 * - `data.replies` - Array of new reply objects
 * - `data.count` - Number of new replies
 * - `data.latestReply` - Most recent reply
 */

import type { TriggerEvaluator } from "../types";
import { createResult } from "./result";

/**
 * Evaluates NEW_REPLY trigger
 * Checks for replies to user's tweets in the last 60 seconds
 */
export const newReplyEvaluator: TriggerEvaluator = (_config, context) => {
	const replies = context.replies || [];
	const newReplies = replies.filter(
		(r) => r.createdAt > (context.currentTime || Date.now()) - 60000,
	);

	if (newReplies.length === 0) {
		return createResult(false, "NEW_REPLY");
	}

	return createResult(true, "NEW_REPLY", {
		replies: newReplies,
		count: newReplies.length,
		latestReply: newReplies[0],
	});
};
