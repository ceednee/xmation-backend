/**
 * Triggers Module
 * 
 * Provides trigger evaluators that determine when workflows should execute.
 * Triggers monitor X (Twitter) events and conditions, firing when criteria are met.
 * 
 * ## Available Triggers
 * 
 * ### Engagement Triggers
 * - `NEW_MENTION` - Someone mentions your account
 * - `NEW_REPLY` - Someone replies to your tweet
 * - `POST_REPOSTED` - Someone retweets your post
 * - `HIGH_ENGAGEMENT` - Post engagement exceeds threshold
 * 
 * ### Follower Triggers
 * - `NEW_FOLLOWER` - Someone follows your account
 * - `UNFOLLOW_DETECTED` - Someone unfollowed you
 * 
 * ### Content Triggers
 * - `CONTENT_GAP` - Haven't posted in X hours
 * - `OPTIMAL_POST_TIME` - Current time is optimal for posting
 * 
 * ### Message Triggers
 * - `NEW_DM` - Received a direct message
 * 
 * ### Quality Triggers
 * - `NEGATIVE_SENTIMENT` - Negative sentiment detected
 * - `LINK_BROKEN` - A link in bio or tweets is broken
 * 
 * ### Manual Triggers
 * - `MANUAL_TRIGGER` - User manually triggers workflow
 * 
 * ## Usage
 * 
 * ```typescript
 * import { triggerRegistry, getTriggerDefinition } from "./triggers";
 * 
 * // Get trigger definition
 * const trigger = getTriggerDefinition("NEW_MENTION");
 * 
 * // Evaluate trigger
 * const result = await trigger.evaluator(config, context);
 * if (result.triggered) {
 *   // Queue workflow execution
 * }
 * ```
 */

// Export types
export type {
	TriggerResult,
	TriggerEvaluator,
	TriggerContext,
	TriggerDefinition,
	MentionData,
	ReplyData,
	RetweetData,
	PostData,
	FollowerData,
	DMData,
	LinkData,
} from "./types";

// Export evaluators
export {
	newMentionEvaluator,
	newReplyEvaluator,
	postRepostedEvaluator,
	highEngagementEvaluator,
	contentGapEvaluator,
	optimalPostTimeEvaluator,
	unfollowDetectedEvaluator,
	newDMEvaluator,
	manualTriggerEvaluator,
	negativeSentimentEvaluator,
	linkBrokenEvaluator,
	triggerRegistry,
	getTriggerDefinition,
	getAllTriggerDefinitions,
} from "./evaluators";
