/**
 * Trigger Evaluator: POST_REPOSTED
 * 
 * Detects when someone reposts/retweets the user's content.
 * Filters reposts from the last 60 seconds to avoid re-triggering.
 * 
 * ## Configuration
 * No configuration options (evaluates all new reposts)
 * 
 * ## Trigger Data
 * - `retweets` - Array of recent retweets of user's posts
 * - `currentTime` - Current timestamp for recency check
 * 
 * ## Returns
 * - `triggered` - True if any reposts in last 60 seconds
 * - `data.retweets` - Array of new retweet objects
 * - `data.count` - Number of new reposts
 * - `data.latestRetweet` - Most recent repost
 */

import type { TriggerEvaluator } from "../types";
import { createResult } from "./result";

/**
 * Evaluates POST_REPOSTED trigger
 * Checks for retweets/reposts of user's content in the last 60 seconds
 */
export const postRepostedEvaluator: TriggerEvaluator = (_config, context) => {
	const retweets = context.retweets || [];
	const newRetweets = retweets.filter(
		(r) => r.createdAt > (context.currentTime || Date.now()) - 60000,
	);

	if (newRetweets.length === 0) {
		return createResult(false, "POST_REPOSTED");
	}

	return createResult(true, "POST_REPOSTED", {
		retweets: newRetweets,
		count: newRetweets.length,
		latestRetweet: newRetweets[0],
	});
};
