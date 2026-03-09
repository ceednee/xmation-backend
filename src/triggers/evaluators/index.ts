import type { TriggerDefinition } from "../types";
import { newMentionEvaluator } from "./mention";
import { newReplyEvaluator } from "./reply";
import { postRepostedEvaluator } from "./repost";
import { highEngagementEvaluator } from "./engagement";
import { contentGapEvaluator } from "./content-gap";
import { optimalPostTimeEvaluator } from "./optimal-time";
import { unfollowDetectedEvaluator } from "./unfollow";
import { newDMEvaluator } from "./dm";
import { newFollowerEvaluator } from "./follower";
import { manualTriggerEvaluator } from "./manual";
import { negativeSentimentEvaluator } from "./sentiment";
import { linkBrokenEvaluator } from "./link-broken";

// Re-export all evaluators
export { newMentionEvaluator } from "./mention";
export { newReplyEvaluator } from "./reply";
export { postRepostedEvaluator } from "./repost";
export { highEngagementEvaluator } from "./engagement";
export { contentGapEvaluator } from "./content-gap";
export { optimalPostTimeEvaluator } from "./optimal-time";
export { unfollowDetectedEvaluator } from "./unfollow";
export { newDMEvaluator } from "./dm";
export { newFollowerEvaluator } from "./follower";
export { manualTriggerEvaluator } from "./manual";
export { negativeSentimentEvaluator } from "./sentiment";
export { linkBrokenEvaluator } from "./link-broken";

const createDef = (
	type: string,
	name: string,
	description: string,
	evaluator: TriggerDefinition["evaluator"],
	defaultConfig?: Record<string, unknown>,
): [string, TriggerDefinition] => [
	type,
	{ type, name, description, evaluator, defaultConfig },
];

export const triggerRegistry: Map<string, TriggerDefinition> = new Map([
	createDef("NEW_MENTION", "New Mention", "Triggered when someone @mentions you", newMentionEvaluator),
	createDef("NEW_REPLY", "New Reply", "Triggered when someone replies to your tweet", newReplyEvaluator),
	createDef("POST_REPOSTED", "Post Reposted", "Triggered when someone retweets your post", postRepostedEvaluator),
	createDef("HIGH_ENGAGEMENT", "High Engagement", "Triggered when post engagement exceeds threshold", highEngagementEvaluator, { threshold: 100, timeWindow: 3600000 }),
	createDef("CONTENT_GAP", "Content Gap", "Triggered when no posts in specified hours", contentGapEvaluator, { gapHours: 24 }),
	createDef("OPTIMAL_POST_TIME", "Optimal Post Time", "Triggered at optimal posting times", optimalPostTimeEvaluator, { optimalHours: [9, 12, 17], timezone: "UTC" }),
	createDef("UNFOLLOW_DETECTED", "Unfollow Detected", "Triggered when someone unfollows you", unfollowDetectedEvaluator),
	createDef("NEW_DM", "New DM", "Triggered when you receive a direct message", newDMEvaluator),
	createDef("NEW_FOLLOWER", "New Follower", "Triggered when someone follows you", newFollowerEvaluator, { minFollowers: 1 }),
	createDef("MANUAL_TRIGGER", "Manual Trigger", "Triggered when user clicks button", manualTriggerEvaluator),
	createDef("NEGATIVE_SENTIMENT", "Negative Sentiment", "Triggered when negative sentiment detected", negativeSentimentEvaluator, {
		negativeWords: ["terrible", "awful", "bad", "hate", "worst", "suck", "disappointing"],
	}),
	createDef("LINK_BROKEN", "Link Broken", "Triggered when a bio or post link is broken", linkBrokenEvaluator),
]);

export const getTriggerDefinition = (type: string): TriggerDefinition | undefined =>
	triggerRegistry.get(type);

export const getAllTriggerDefinitions = (): TriggerDefinition[] =>
	Array.from(triggerRegistry.values());
