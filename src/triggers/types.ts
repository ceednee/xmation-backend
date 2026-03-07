// Trigger evaluation result
export interface TriggerResult {
	triggered: boolean;
	triggerType: string;
	data?: Record<string, unknown>;
	timestamp: number;
}

// Trigger evaluator function type
export type TriggerEvaluator = (
	config: Record<string, unknown>,
	context: TriggerContext,
) => Promise<TriggerResult> | TriggerResult;

// Context passed to trigger evaluators
export interface TriggerContext {
	userId: string;
	xUserId?: string;
	mentions?: MentionData[];
	replies?: ReplyData[];
	retweets?: RetweetData[];
	posts?: PostData[];
	followers?: FollowerData[];
	dms?: DMData[];
	lastPostTime?: number;
	currentTime?: number;
	manualTrigger?: boolean;
	links?: LinkData[];
}

// Data types for triggers
export interface MentionData {
	id: string;
	text: string;
	authorId: string;
	authorUsername: string;
	createdAt: number;
}

export interface ReplyData {
	id: string;
	tweetId: string;
	text: string;
	authorId: string;
	authorUsername: string;
	createdAt: number;
}

export interface RetweetData {
	id: string;
	originalTweetId: string;
	retweetedBy: string;
	retweetedById: string;
	createdAt: number;
}

export interface PostData {
	id: string;
	text: string;
	likes: number;
	replies: number;
	retweets: number;
	createdAt: number;
}

export interface FollowerData {
	id: string;
	username: string;
	action: "follow" | "unfollow";
	timestamp: number;
}

export interface DMData {
	id: string;
	senderId: string;
	senderUsername: string;
	text: string;
	createdAt: number;
}

export interface LinkData {
	url: string;
	status: number;
	location: "bio" | "post";
}

// Trigger registry entry
export interface TriggerDefinition {
	type: string;
	name: string;
	description: string;
	evaluator: TriggerEvaluator;
	defaultConfig?: Record<string, unknown>;
}
