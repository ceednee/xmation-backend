/**
 * High Engagement Trigger Evaluator
 * 
 * Evaluates whether any posts have exceeded the engagement threshold.
 * Useful for detecting viral content or posts needing attention.
 * 
 * ## Trigger Data
 * 
 * - `posts` - Array of user's recent posts with engagement metrics
 * - `currentTime` - Current timestamp for time window calculation
 * 
 * ## Configuration
 * 
 * - `threshold` - Minimum engagement count to trigger (default: 100)
 *   - Engagement = likes + replies + retweets
 * - `timeWindow` - Time window in milliseconds (default: 1 hour)
 * 
 * ## Logic
 * 
 * 1. Filter posts within time window
 * 2. Calculate engagement for each post
 * 3. Check if engagement exceeds threshold
 * 4. Return triggered=true if any post qualifies
 * 
 * ## Returns
 * 
 * - `triggered: true` - High engagement post(s) detected
 * - `data.posts` - Array of qualifying posts
 * - `data.topPost` - Post with highest engagement
 * - `data.engagement` - Engagement count of top post
 * - `data.threshold` - Threshold that was exceeded
 */

import type { TriggerEvaluator } from "../types";
import { createResult } from "./result";

/**
 * Evaluates HIGH_ENGAGEMENT trigger
 * Checks if any recent post exceeds the engagement threshold
 */
export const highEngagementEvaluator: TriggerEvaluator = (config, context) => {
	const threshold = Number(config.threshold) || 100;
	const timeWindow = Number(config.timeWindow) || 3600000;
	const posts = context.posts || [];

	const recentPosts = posts.filter(
		(p) =>
			p.createdAt > (context.currentTime || Date.now()) - timeWindow &&
			p.likes + p.replies + p.retweets > threshold,
	);

	if (recentPosts.length === 0) {
		return createResult(false, "HIGH_ENGAGEMENT");
	}

	const topPost = recentPosts.sort(
		(a, b) =>
			b.likes + b.replies + b.retweets - (a.likes + a.replies + a.retweets),
	)[0];

	return createResult(true, "HIGH_ENGAGEMENT", {
		posts: recentPosts,
		topPost,
		engagement: topPost.likes + topPost.replies + topPost.retweets,
		threshold,
	});
};
