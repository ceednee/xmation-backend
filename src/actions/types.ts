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

// X API response type - allows any additional properties
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface XApiResponse extends Record<string, unknown> {
	id?: string;
	success?: boolean;
	data?: unknown;
}

// X API Client interface (to be implemented)
export interface XApiClient {
	replyToTweet: (tweetId: string, text: string) => Promise<XApiResponse>;
	retweet: (tweetId: string) => Promise<XApiResponse>;
	quoteTweet: (tweetId: string, comment: string) => Promise<XApiResponse>;
	sendDM: (userId: string, text: string) => Promise<XApiResponse>;
	followUser: (userId: string) => Promise<XApiResponse>;
	pinTweet: (tweetId: string) => Promise<XApiResponse>;
	addToList: (listId: string, userId: string) => Promise<XApiResponse>;
	blockUser: (userId: string) => Promise<XApiResponse>;
	reportSpam: (userId: string, reason: string) => Promise<XApiResponse>;
}
