/**
 * Trigger Evaluator Factory
 * 
 * Creates a map of trigger types to their evaluator functions.
 * Centralizes trigger evaluator registration for the trigger processor.
 * 
 * @module trigger-processor/evaluators
 */

import type { TriggerEvaluator } from "../../triggers/types";
import {
	newMentionEvaluator,
	newFollowerEvaluator,
	contentGapEvaluator,
	highEngagementEvaluator,
	optimalPostTimeEvaluator,
	newReplyEvaluator,
	postRepostedEvaluator,
	unfollowDetectedEvaluator,
	newDMEvaluator,
	manualTriggerEvaluator,
	negativeSentimentEvaluator,
	linkBrokenEvaluator,
} from "../../triggers/evaluators";

/**
 * Create a map of all available trigger evaluators.
 * 
 * Returns a Map where keys are trigger type strings and values are
 * the corresponding evaluator functions. This map is used by the
 * trigger processor to route trigger evaluation to the correct handler.
 * 
 * @returns A Map of trigger types to their evaluator functions
 * 
 * @example
 * ```typescript
 * const evaluators = createEvaluatorMap();
 * const mentionEvaluator = evaluators.get("NEW_MENTION");
 * const result = await mentionEvaluator!(config, context);
 * ```
 */
export const createEvaluatorMap = (): Map<string, TriggerEvaluator> => {
	return new Map([
		["NEW_MENTION", newMentionEvaluator],
		["NEW_FOLLOWER", newFollowerEvaluator],
		["CONTENT_GAP", contentGapEvaluator],
		["HIGH_ENGAGEMENT", highEngagementEvaluator],
		["OPTIMAL_POST_TIME", optimalPostTimeEvaluator],
		["NEW_REPLY", newReplyEvaluator],
		["POST_REPOSTED", postRepostedEvaluator],
		["UNFOLLOW_DETECTED", unfollowDetectedEvaluator],
		["NEW_DM", newDMEvaluator],
		["MANUAL_TRIGGER", manualTriggerEvaluator],
		["NEGATIVE_SENTIMENT", negativeSentimentEvaluator],
		["LINK_BROKEN", linkBrokenEvaluator],
	]);
};
