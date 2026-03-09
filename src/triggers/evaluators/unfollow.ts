/**
 * Trigger Evaluator: UNFOLLOW_DETECTED
 * 
 * Detects when users unfollow the account.
 * Filters followers array for action type "unfollow".
 * 
 * ## Configuration
 * No configuration options (reports all unfollows)
 * 
 * ## Trigger Data
 * - `followers` - Array of follower events with action type
 * 
 * ## Returns
 * - `triggered` - True if any unfollow actions detected
 * - `data.unfollows` - Array of unfollow events
 * - `data.count` - Total number of unfollows
 * - `data.recentUnfollows` - First 10 unfollow events (for brevity)
 */

import type { TriggerEvaluator } from "../types";
import { createResult } from "./result";

/**
 * Evaluates UNFOLLOW_DETECTED trigger
 * Checks for unfollow actions in the followers data
 */
export const unfollowDetectedEvaluator: TriggerEvaluator = (_config, context) => {
	const followers = context.followers || [];
	const unfollows = followers.filter((f) => f.action === "unfollow");

	if (unfollows.length === 0) {
		return createResult(false, "UNFOLLOW_DETECTED");
	}

	return createResult(true, "UNFOLLOW_DETECTED", {
		unfollows,
		count: unfollows.length,
		recentUnfollows: unfollows.slice(0, 10),
	});
};
