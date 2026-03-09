/**
 * New Follower Trigger Evaluator
 * 
 * Evaluates whether new followers have been detected.
 * Supports minimum follower count threshold.
 * 
 * ## Trigger Data
 * 
 * - `newFollowers` - Array of new followers detected since last check
 * 
 * ## Configuration
 * 
 * - `minFollowers` - Minimum number of new followers to trigger (default: 1)
 * 
 * ## Logic
 * 
 * 1. Count new followers
 * 2. Compare against minFollowers threshold
 * 3. Return triggered=true if threshold met
 * 
 * ## Returns
 * 
 * - `triggered: true` - New followers detected
 * - `data.followers` - Array of new followers
 * - `data.count` - Number of new followers
 * - `data.latestFollower` - Most recent follower
 */

import type { TriggerEvaluator } from "../types";
import { createResult } from "./result";

/**
 * Evaluates NEW_FOLLOWER trigger
 * Checks if new followers meet the minimum threshold
 */
export const newFollowerEvaluator: TriggerEvaluator = (config, context) => {
	const newFollowers = context.newFollowers || [];
	const minFollowers = Number(config.minFollowers) || 1;

	if (newFollowers.length < minFollowers) {
		return createResult(false, "NEW_FOLLOWER");
	}

	return createResult(true, "NEW_FOLLOWER", {
		followers: newFollowers,
		count: newFollowers.length,
		latestFollower: newFollowers[0],
	});
};
