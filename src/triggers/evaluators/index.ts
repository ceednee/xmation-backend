/**
 * Trigger Evaluators Module
 * 
 * Evaluates different trigger types against incoming events.
 * Each evaluator checks if its trigger conditions are met.
 * 
 * ## Trigger Types
 * 
 * | Trigger | Description | Evaluates |
 * |---------|-------------|-----------|
 * | NEW_MENTION | User mentioned | mentions array |
 * | NEW_FOLLOWER | New follower | newFollowers array |
 * | NEW_REPLY | Reply to user's tweet | replies array |
 * | REPOST | User's tweet reposted | reposts array |
 * | HIGH_ENGAGEMENT | Tweet goes viral | engagement metrics |
 * | DM_RECEIVED | Direct message received | DMs array |
 * | CONTENT_GAP | Low posting activity | post frequency |
 * | OPTIMAL_TIME | Best posting time | current time + history |
 * | SENTIMENT_SHIFT | Sentiment change | sentiment analysis |
 * | MANUAL | Manually triggered | button click |
 * | LINK_BROKEN | Broken link detected | URL validation |
 * | UNFOLLOW | User unfollowed | follower changes |
 * 
 * ## Evaluation Logic
 * 
 * Evaluators receive a `TriggerContext` containing:
 * - Current mentions, followers, replies
 * - User stats and history
 * - Current time
 * 
 * Returns `TriggerResult`:
 * - `triggered: boolean` - Whether trigger fired
 * - `data?: object` - Additional data for actions
 * 
 * ## Module Structure
 * 
 * - `mention.ts` - NEW_MENTION evaluator
 * - `follower.ts` - NEW_FOLLOWER evaluator
 * - `reply.ts` - NEW_REPLY evaluator
 * - `repost.ts` - REPOST evaluator
 * - `engagement.ts` - HIGH_ENGAGEMENT evaluator
 * - `dm.ts` - DM_RECEIVED evaluator
 * - `content-gap.ts` - CONTENT_GAP evaluator
 * - `optimal-time.ts` - OPTIMAL_TIME evaluator
 * - `sentiment.ts` - SENTIMENT_SHIFT evaluator
 * - `manual.ts` - MANUAL evaluator
 * - `link-broken.ts` - LINK_BROKEN evaluator
 * - `unfollow.ts` - UNFOLLOW evaluator
 * 
 * ## Usage
 * 
 * ```typescript
 * import { newMentionEvaluator } from "./evaluators/mention";
 * 
 * const result = newMentionEvaluator(
 *   { config: { filter: "all" } },
 *   { mentions: [{ text: "@user hello" }] }
 * );
 * 
 * if (result.triggered) {
 *   console.log("Trigger fired!", result.data);
 * }
 * ```
 */

import type { TriggerDefinition } from "../types";
import { newMentionEvaluator } from "./mention";
import { newReplyEvaluator } from "./reply";
import { postRepostedEvaluator } from "./repost";
import { highEngagementEvaluator } from "./engagement";
import { newFollowerEvaluator } from "./follower";
import { newDMEvaluator } from "./dm";
import { contentGapEvaluator } from "./content-gap";
import { optimalPostTimeEvaluator } from "./optimal-time";
import { negativeSentimentEvaluator } from "./sentiment";
import { manualTriggerEvaluator } from "./manual";
import { linkBrokenEvaluator } from "./link-broken";
import { unfollowDetectedEvaluator } from "./unfollow";

// Re-export all evaluators
export { newMentionEvaluator } from "./mention";
export { newReplyEvaluator } from "./reply";
export { postRepostedEvaluator } from "./repost";
export { highEngagementEvaluator } from "./engagement";
export { newFollowerEvaluator } from "./follower";
export { newDMEvaluator } from "./dm";
export { contentGapEvaluator } from "./content-gap";
export { optimalPostTimeEvaluator } from "./optimal-time";
export { negativeSentimentEvaluator } from "./sentiment";
export { manualTriggerEvaluator } from "./manual";
export { linkBrokenEvaluator } from "./link-broken";
export { unfollowDetectedEvaluator } from "./unfollow";
export type { TriggerEvaluator, TriggerResult } from "./result";

// Create trigger definition helper
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

/**
 * Global registry of all available triggers.
 * Maps trigger type strings to their definitions.
 */
export const triggerRegistry: Map<string, TriggerDefinition> = new Map([
	createDef(
		"NEW_MENTION",
		"New Mention",
		"Triggered when someone @mentions you",
		newMentionEvaluator,
		{ keywords: [] },
	),
	createDef(
		"NEW_REPLY",
		"New Reply",
		"Triggered when someone replies to your tweet",
		newReplyEvaluator,
	),
	createDef(
		"POST_REPOSTED",
		"Post Reposted",
		"Triggered when someone retweets your post",
		postRepostedEvaluator,
	),
	createDef(
		"HIGH_ENGAGEMENT",
		"High Engagement",
		"Triggered when a post gets high engagement",
		highEngagementEvaluator,
		{ threshold: 100, timeWindow: 3600000 },
	),
	createDef(
		"CONTENT_GAP",
		"Content Gap",
		"Triggered when no posts in specified hours",
		contentGapEvaluator,
		{ gapHours: 24 },
	),
	createDef(
		"OPTIMAL_POST_TIME",
		"Optimal Post Time",
		"Triggered at optimal posting times",
		optimalPostTimeEvaluator,
		{ optimalHours: [9, 12, 17], timezone: "UTC" },
	),
	createDef(
		"UNFOLLOW_DETECTED",
		"Unfollow Detected",
		"Triggered when someone unfollows you",
		unfollowDetectedEvaluator,
	),
	createDef(
		"NEW_DM",
		"New DM",
		"Triggered when you receive a direct message",
		newDMEvaluator,
	),
	createDef(
		"NEW_FOLLOWER",
		"New Follower",
		"Triggered when someone follows you",
		newFollowerEvaluator,
		{ minFollowers: 1 },
	),
	createDef(
		"MANUAL_TRIGGER",
		"Manual Trigger",
		"Triggered when user clicks button",
		manualTriggerEvaluator,
	),
	createDef(
		"NEGATIVE_SENTIMENT",
		"Negative Sentiment",
		"Triggered when negative sentiment detected",
		negativeSentimentEvaluator,
		{
			negativeWords: ["terrible", "awful", "bad", "hate", "worst", "suck", "disappointing"],
		},
	),
	createDef(
		"LINK_BROKEN",
		"Link Broken",
		"Triggered when a bio or post link is broken",
		linkBrokenEvaluator,
	),
]);

/**
 * Get a trigger definition by its type string.
 * 
 * @param type - The trigger type (e.g., "NEW_MENTION")
 * @returns The trigger definition or undefined
 */
export function getTriggerDefinition(type: string): TriggerDefinition | undefined {
	return triggerRegistry.get(type);
}

/**
 * Get all available trigger definitions.
 * 
 * @returns Array of all trigger definitions
 */
export function getAllTriggerDefinitions(): TriggerDefinition[] {
	return Array.from(triggerRegistry.values());
}
