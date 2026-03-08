// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ActionOutput {
	[key: string]: unknown;
}

// Action execution result
export interface ActionResult {
	success: boolean;
	actionType: string;
	output?: Record<string, unknown>;
	error?: string;
	executionTimeMs: number;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ActionConfig {
	[key: string]: unknown;
}

// Action executor function type
export type ActionExecutor = (
	config: Record<string, unknown>,
	context: ActionContext,
) => Promise<ActionResult> | ActionResult;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface TriggerData {
	[key: string]: unknown;
}

// Context passed to action executors
export interface ActionContext {
	userId: string;
	xUserId?: string;
	workflowId: string;
	runId: string;
	triggerData: Record<string, TriggerData>;
	previousResults?: ActionResult[];
	dryRun: boolean;
}

// Action definition
export interface ActionDefinition {
	type: string;
	name: string;
	description: string;
	executor: ActionExecutor;
	defaultConfig?: Record<string, unknown>;
	requiredConfig?: string[];
}

// X API response type - using any for flexibility with external API
// biome-ignore lint/suspicious/noExplicitAny: X API responses vary widely
export type XApiResponse = any;

// Create tweet options type
export interface CreateTweetOptions {
	reply?: { in_reply_to_tweet_id: string };
	quote_tweet_id?: string;
}

// Pagination options
export interface PaginationOptions {
	max_results?: number;
	pagination_token?: string;
}

// X API Client interface - matches real X API implementation
// Using any return types to match real API responses
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface XApiClient {
	createTweet: (
		text: string,
		options?: CreateTweetOptions,
	) => Promise<XApiResponse>;
	likeTweet: (tweetId: string, userId: string) => Promise<XApiResponse>;
	retweet: (tweetId: string, userId: string) => Promise<XApiResponse>;
	sendDM: (userId: string, text: string) => Promise<XApiResponse>;
	followUser: (targetUserId: string, userId: string) => Promise<XApiResponse>;
	getFollowers: (
		userId: string,
		options?: PaginationOptions,
	) => Promise<XApiResponse>;
	getMentions: (
		userId: string,
		options?: PaginationOptions,
	) => Promise<XApiResponse>;
	getUserTweets: (
		userId: string,
		options?: PaginationOptions,
	) => Promise<XApiResponse>;
	getAuthenticatedUser: () => Promise<XApiResponse>;
	blockUser: (targetUserId: string, userId: string) => Promise<XApiResponse>;
	// Convenience methods for action executors
	replyToTweet: (tweetId: string, text: string) => Promise<XApiResponse>;
	quoteTweet: (tweetId: string, comment: string) => Promise<XApiResponse>;
	pinTweet: (tweetId: string) => Promise<XApiResponse>;
	addToList: (listId: string, userId: string) => Promise<XApiResponse>;
	reportSpam: (userId: string, reason: string) => Promise<XApiResponse>;
}
