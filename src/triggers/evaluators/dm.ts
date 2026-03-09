/**
 * Trigger Evaluator: NEW_DM
 * 
 * Detects when the user receives new direct messages.
 * Filters messages from the last 60 seconds to avoid re-triggering.
 * 
 * ## Configuration
 * No configuration options (evaluates all new DMs)
 * 
 * ## Trigger Data
 * - `dms` - Array of recent direct messages
 * - `currentTime` - Current timestamp for recency check
 * 
 * ## Returns
 * - `triggered` - True if any DMs received in last 60 seconds
 * - `data.dms` - Array of new DM objects
 * - `data.count` - Number of new DMs
 * - `data.latestDM` - Most recent DM
 */

import type { TriggerEvaluator } from "../types";
import { createResult } from "./result";

/**
 * Evaluates NEW_DM trigger
 * Checks for direct messages received in the last 60 seconds
 */
export const newDMEvaluator: TriggerEvaluator = (_config, context) => {
	const dms = context.dms || [];
	const newDMs = dms.filter(
		(dm) => dm.createdAt > (context.currentTime || Date.now()) - 60000,
	);

	if (newDMs.length === 0) {
		return createResult(false, "NEW_DM");
	}

	return createResult(true, "NEW_DM", {
		dms: newDMs,
		count: newDMs.length,
		latestDM: newDMs[0],
	});
};
