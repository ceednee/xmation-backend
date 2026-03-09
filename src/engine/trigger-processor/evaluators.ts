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
