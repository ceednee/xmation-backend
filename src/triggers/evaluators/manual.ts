/**
 * Trigger Evaluator: MANUAL_TRIGGER
 * 
 * Handles manual trigger activation initiated by user action.
 * Typically triggered by a button click in the UI or API call.
 * 
 * ## Configuration
 * No configuration options
 * 
 * ## Trigger Data
 * - `manualTrigger` - Boolean flag indicating manual activation
 * - `userId` - ID of user who triggered
 * - `currentTime` - Timestamp of trigger
 * 
 * ## Returns
 * - `triggered` - True if manualTrigger flag is set in context
 * - `data.triggeredAt` - Unix timestamp when triggered
 * - `data.triggeredBy` - User ID who triggered
 */

import type { TriggerEvaluator } from "../types";
import { createResult } from "./result";

/**
 * Evaluates MANUAL_TRIGGER trigger
 * Checks if the manual trigger flag is set in context
 */
export const manualTriggerEvaluator: TriggerEvaluator = (_config, context) => {
	if (!context.manualTrigger) {
		return createResult(false, "MANUAL_TRIGGER");
	}

	return createResult(true, "MANUAL_TRIGGER", {
		triggeredAt: context.currentTime || Date.now(),
		triggeredBy: context.userId,
	});
};
