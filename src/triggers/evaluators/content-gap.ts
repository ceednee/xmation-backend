/**
 * Trigger Evaluator: CONTENT_GAP
 * 
 * Detects when a user hasn't posted content for a specified period.
 * Useful for content calendar reminders and re-engagement campaigns.
 * 
 * ## Configuration
 * - `gapHours` - Hours since last post to trigger (default: 24)
 * 
 * ## Trigger Data
 * - `lastPostTime` - Timestamp of user's last post
 * - `currentTime` - Current timestamp for comparison
 * 
 * ## Returns
 * - `triggered` - True if hours since last post exceeds gapHours
 * - `data.hoursSinceLastPost` - Hours since last post (null if no posts)
 * - `data.lastPostTime` - Timestamp of last post
 * - `data.message` - "No posts yet" if user has never posted
 */

import type { TriggerEvaluator } from "../types";
import { createResult } from "./result";

/**
 * Evaluates CONTENT_GAP trigger
 * Checks if user hasn't posted within the configured gap threshold
 */
export const contentGapEvaluator: TriggerEvaluator = (config, context) => {
	const gapThreshold = Number(config.gapHours) || 24;
	const lastPostTime = context.lastPostTime || 0;

	if (lastPostTime === 0) {
		return createResult(true, "CONTENT_GAP", {
			hoursSinceLastPost: null,
			message: "No posts yet",
		});
	}

	const hoursSinceLastPost =
		((context.currentTime || Date.now()) - lastPostTime) / (60 * 60 * 1000);

	if (hoursSinceLastPost > gapThreshold) {
		return createResult(true, "CONTENT_GAP", {
			hoursSinceLastPost: Math.floor(hoursSinceLastPost),
			lastPostTime,
		});
	}

	return createResult(false, "CONTENT_GAP");
};
