/**
 * Trigger System Types
 * 
 * Defines types for trigger evaluation including results, evaluators,
 * context data, and trigger definitions. Triggers determine when
 * workflows should execute based on X (Twitter) events and conditions.
 */

/**
 * Result of trigger evaluation
 * 
 * @property triggered - Whether the trigger condition was met
 * @property triggerType - The type of trigger that was evaluated
 * @property data - Optional data about the trigger event
 * @property timestamp - Unix timestamp when evaluation occurred
 * @property error - Error message if evaluation failed
 */
export interface TriggerResult {
	triggered: boolean;
	triggerType: string;
	data?: Record<string, unknown>;
	timestamp: number;
	error?: string;
}

/**
 * Trigger evaluator function signature
 * 
 * Implementations receive the trigger configuration and context,
 * evaluate whether conditions are met, and return a result.
 * 
 * @param config - Trigger-specific configuration (e.g., { threshold: 100 })
 * @param context - Context with user data, mentions, posts, etc.
 * @returns Promise resolving to trigger result
 */
export type TriggerEvaluator = (
	config: Record<string, unknown>,
	context: TriggerContext,
) => Promise<TriggerResult> | TriggerResult;

/**
 * Context object provided to trigger evaluators
 * 
 * Contains all data needed to evaluate triggers:
 * - User identity
 * - Timeline data (mentions, replies, retweets, posts)
 * - Follower information
 * - Direct messages
 * - System state (time, manual triggers)
 * 
 * @example
 * ```typescript
 * const context: TriggerContext = {
 *   userId: "user_123",
 *   xUserId: "x_user_456",
 *   mentions: [{ id: "tweet_1", authorUsername: "alice", ... }],
 *   currentTime: Date.now(),
 * }
 * ```
 */
export interface TriggerContext {
	/** Internal user ID */
	userId: string;
	/** X (Twitter) user ID */
	xUserId?: string;
	/** Recent mentions of the user */
	mentions?: MentionData[];
	/** Recent replies to the user's tweets */
	replies?: ReplyData[];
	/** Recent retweets of the user's posts */
	retweets?: RetweetData[];
	/** User's own recent posts */
	posts?: PostData[];
	/** Current followers */
	followers?: FollowerData[];
	/** New followers since last check */
	newFollowers?: Array<{ id: string; username: string; name?: string }>;
	/** Recent direct messages */
	dms?: DMData[];
	/** Timestamp of user's last post */
	lastPostTime?: number;
	/** Current timestamp for time-based triggers */
	currentTime?: number;
	/** Whether manually triggered */
	manualTrigger?: boolean;
	/** Links to check for broken status */
	links?: LinkData[];
}

/**
 * Mention data from X API
 */
export interface MentionData {
	id: string;
	text: string;
	authorId: string;
	authorUsername: string;
	createdAt: number;
}

/**
 * Reply data from X API
 */
export interface ReplyData {
	id: string;
	tweetId: string;
	text: string;
	authorId: string;
	authorUsername: string;
	createdAt: number;
}

/**
 * Retweet data from X API
 */
export interface RetweetData {
	id: string;
	originalTweetId: string;
	retweetedBy: string;
	retweetedById: string;
	createdAt: number;
}

/**
 * Post data from X API (user's own tweets)
 */
export interface PostData {
	id: string;
	text: string;
	likes: number;
	replies: number;
	retweets: number;
	createdAt: number;
}

/**
 * Follower change data
 */
export interface FollowerData {
	id: string;
	username: string;
	action: "follow" | "unfollow";
	timestamp: number;
}

/**
 * Direct message data from X API
 */
export interface DMData {
	id: string;
	senderId: string;
	senderUsername: string;
	text: string;
	createdAt: number;
}

/**
 * Link status data for broken link detection
 */
export interface LinkData {
	url: string;
	status: number;
	location: "bio" | "post";
}

/**
 * Trigger definition metadata
 * 
 * Used to register triggers in the trigger registry and provide
 * UI information for workflow builders.
 * 
 * @example
 * ```typescript
 * export const newMentionDefinition: TriggerDefinition = {
 *   type: "NEW_MENTION",
 *   name: "New Mention",
 *   description: "Triggers when someone mentions your account",
 *   evaluator: newMentionEvaluator,
 *   defaultConfig: { keywords: [] },
 * }
 * ```
 */
export interface TriggerDefinition {
	type: string;
	name: string;
	description: string;
	evaluator: TriggerEvaluator;
	defaultConfig?: Record<string, unknown>;
}
