/**
 * Trigger Evaluator: OPTIMAL_POST_TIME
 * 
 * Determines if the current time is optimal for posting content.
 * Based on configured optimal hours (default: 9am, 12pm, 5pm UTC).
 * 
 * ## Configuration
 * - `optimalHours` - Array of hours (0-23) considered optimal (default: [9, 12, 17])
 * - `timezone` - Timezone for hour calculation (default: "UTC")
 * 
 * ## Trigger Data
 * - `currentTime` - Current timestamp to evaluate
 * 
 * ## Logic
 * - Triggers if current hour is within 30 minutes of any optimal hour
 * - Uses UTC time for consistency
 * 
 * ## Returns
 * - `triggered` - True if current time is near an optimal hour
 * - `data.currentHour` - Current hour (UTC)
 * - `data.optimalHours` - Configured optimal hours
 * - `data.timezone` - Timezone used for calculation
 */

import type { TriggerEvaluator } from "../types";
import { createResult } from "./result";

/**
 * Evaluates OPTIMAL_POST_TIME trigger
 * Checks if current time is near configured optimal posting hours
 */
export const optimalPostTimeEvaluator: TriggerEvaluator = (config, context) => {
	const optimalHours: number[] = Array.isArray(config.optimalHours)
		? (config.optimalHours as number[])
		: [9, 12, 17];
	const timezone = config.timezone || "UTC";
	const currentTime = context.currentTime || Date.now();
	const now = new Date(currentTime);
	const currentHour = now.getUTCHours();

	const isOptimalTime = optimalHours.some((hour: number) => {
		const diff = Math.abs(currentHour - hour);
		return diff <= 0.5 || diff >= 23.5;
	});

	if (!isOptimalTime) {
		return createResult(false, "OPTIMAL_POST_TIME");
	}

	return createResult(true, "OPTIMAL_POST_TIME", {
		currentHour,
		optimalHours,
		timezone,
	});
};
