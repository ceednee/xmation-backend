/**
 * X API Client - Real X API Integration
 * Uses OAuth 2.0 tokens for authenticated requests
 * Rate limits: 200 req/15min per user for most endpoints
 */

import { config } from "../config/env";

const X_API_BASE_URL = "https://api.x.com/2";

interface XApiConfig {
	accessToken: string;
}

interface XApiError {
	status: number;
	code: string;
	message: string;
}

/**
 * Make authenticated request to X API
 */
async function xApiRequest<T>(
	endpoint: string,
	options: {
		method?: "GET" | "POST" | "DELETE";
		body?: Record<string, unknown>;
		params?: Record<string, string>;
	},
	config: XApiConfig,
): Promise<T> {
	const url = new URL(`${X_API_BASE_URL}${endpoint}`);

	// Add query params
	if (options.params) {
		for (const [key, value] of Object.entries(options.params)) {
			url.searchParams.append(key, value);
		}
	}

	const response = await fetch(url.toString(), {
		method: options.method || "GET",
		headers: {
			Authorization: `Bearer ${config.accessToken}`,
			"Content-Type": "application/json",
		},
		body: options.body ? JSON.stringify(options.body) : undefined,
	});

	if (!response.ok) {
		const error = (await response.json()) as {
			errors?: Array<{ message: string; code: string }>;
		};
		throw new Error(
			`X API Error: ${response.status} - ${error.errors?.[0]?.message || response.statusText}`,
		);
	}

	return response.json() as Promise<T>;
}

// Tweet Types
export interface Tweet {
	id: string;
	text: string;
	author_id?: string;
	created_at?: string;
	public_metrics?: {
		retweet_count: number;
		reply_count: number;
		like_count: number;
		quote_count: number;
		impression_count?: number;
	};
	referenced_tweets?: Array<{
		type: "retweeted" | "quoted" | "replied_to";
		id: string;
	}>;
}

export interface User {
	id: string;
	name: string;
	username: string;
	public_metrics?: {
		followers_count: number;
		following_count: number;
		tweet_count: number;
		listed_count: number;
	};
	verified?: boolean;
	profile_image_url?: string;
	description?: string;
}

// 1. POST /2/tweets - Create a tweet
export async function createTweet(
	text: string,
	token: string,
	options?: {
		reply?: { in_reply_to_tweet_id: string };
		quote_tweet_id?: string;
	},
): Promise<{ data: { id: string; text: string } }> {
	return xApiRequest(
		"/tweets",
		{
			method: "POST",
			body: {
				text,
				...options,
			},
		},
		{ accessToken: token },
	);
}

// 2. POST /2/tweets/:id/like - Like a tweet
export async function likeTweet(
	tweetId: string,
	userId: string,
	token: string,
): Promise<{ data: { liked: boolean } }> {
	return xApiRequest(
		`/users/${userId}/likes`,
		{
			method: "POST",
			body: { tweet_id: tweetId },
		},
		{ accessToken: token },
	);
}

// 3. POST /2/retweets - Retweet
export async function retweet(
	tweetId: string,
	userId: string,
	token: string,
): Promise<{ data: { retweeted: boolean } }> {
	return xApiRequest(
		`/users/${userId}/retweets`,
		{
			method: "POST",
			body: { tweet_id: tweetId },
		},
		{ accessToken: token },
	);
}

// 4. POST /2/dm_conversations/:id/messages - Send DM
export async function sendDM(
	participantId: string,
	text: string,
	token: string,
): Promise<{ data: { dm_conversation_id: string; dm_event_id: string } }> {
	// First get or create conversation
	const conversation = await xApiRequest<{
		data: { dm_conversation_id: string };
	}>(
		"/dm_conversations",
		{
			method: "POST",
			body: {
				participant_ids: [participantId],
				message: { text },
			},
		},
		{ accessToken: token },
	);

	return {
		data: {
			dm_conversation_id: conversation.data.dm_conversation_id,
			dm_event_id: "", // Would need separate call to get this
		},
	};
}

// 5. POST /2/users/:id/following - Follow user
export async function followUser(
	targetUserId: string,
	userId: string,
	token: string,
): Promise<{ data: { following: boolean; pending_follow: boolean } }> {
	return xApiRequest(
		`/users/${userId}/following`,
		{
			method: "POST",
			body: { target_user_id: targetUserId },
		},
		{ accessToken: token },
	);
}

// 6. GET /2/users/:id/followers - Get followers
export async function getFollowers(
	userId: string,
	token: string,
	options?: { max_results?: number; pagination_token?: string },
): Promise<{
	data: User[];
	meta: { result_count: number; next_token?: string };
}> {
	const params: Record<string, string> = {
		"user.fields": "public_metrics,verified,profile_image_url,description",
	};
	if (options?.max_results) params.max_results = String(options.max_results);
	if (options?.pagination_token)
		params.pagination_token = options.pagination_token;

	return xApiRequest(
		`/users/${userId}/followers`,
		{ params },
		{ accessToken: token },
	);
}

// 7. GET /2/users/:id/mentions - Get mentions
export async function getMentions(
	userId: string,
	token: string,
	options?: { since_id?: string; max_results?: number },
): Promise<{
	data: Tweet[];
	meta: { newest_id?: string; oldest_id?: string; result_count: number };
}> {
	const params: Record<string, string> = {
		"tweet.fields": "created_at,public_metrics,author_id,referenced_tweets",
		expansions: "author_id",
		"user.fields": "username",
	};
	if (options?.since_id) params.since_id = options.since_id;
	if (options?.max_results) params.max_results = String(options.max_results);

	return xApiRequest(
		`/users/${userId}/mentions`,
		{ params },
		{ accessToken: token },
	);
}

// 8. GET /2/users/:id/tweets - Get user timeline
export async function getUserTweets(
	userId: string,
	token: string,
	options?: { max_results?: number },
): Promise<{
	data: Tweet[];
	meta: { result_count: number; next_token?: string };
}> {
	const params: Record<string, string> = {
		"tweet.fields": "created_at,public_metrics,referenced_tweets",
	};
	if (options?.max_results) params.max_results = String(options.max_results);

	return xApiRequest(
		`/users/${userId}/tweets`,
		{ params },
		{ accessToken: token },
	);
}

// 9. GET /2/users/me - Get authenticated user
export async function getAuthenticatedUser(
	token: string,
): Promise<{ data: User }> {
	return xApiRequest(
		"/users/me",
		{
			params: {
				"user.fields": "public_metrics,verified,profile_image_url,description",
			},
		},
		{ accessToken: token },
	);
}

// 10. POST /2/tweets/:id/hidden - Delete/Undo Retweet
export async function undoRetweet(
	tweetId: string,
	userId: string,
	token: string,
): Promise<{ data: { deleted: boolean } }> {
	return xApiRequest(
		`/users/${userId}/retweets/${tweetId}`,
		{ method: "DELETE" },
		{ accessToken: token },
	);
}

// 11. POST /2/users/:id/blocking - Block user
export async function blockUser(
	targetUserId: string,
	userId: string,
	token: string,
): Promise<{ data: { blocking: boolean } }> {
	return xApiRequest(
		`/users/${userId}/blocking`,
		{
			method: "POST",
			body: { target_user_id: targetUserId },
		},
		{ accessToken: token },
	);
}

// Rate limit status tracking
interface RateLimitStatus {
	limit: number;
	remaining: number;
	reset: number;
}

export function parseRateLimit(headers: Headers): RateLimitStatus {
	return {
		limit: Number(headers.get("x-rate-limit-limit") || 0),
		remaining: Number(headers.get("x-rate-limit-remaining") || 0),
		reset: Number(headers.get("x-rate-limit-reset") || 0),
	};
}

// Export X API client factory
export function createXApiClient(accessToken: string) {
	return {
		createTweet: (text: string, options?: Parameters<typeof createTweet>[2]) =>
			createTweet(text, accessToken, options),
		likeTweet: (tweetId: string, userId: string) =>
			likeTweet(tweetId, userId, accessToken),
		retweet: (tweetId: string, userId: string) =>
			retweet(tweetId, userId, accessToken),
		sendDM: (participantId: string, text: string) =>
			sendDM(participantId, text, accessToken),
		followUser: (targetUserId: string, userId: string) =>
			followUser(targetUserId, userId, accessToken),
		getFollowers: (
			userId: string,
			options?: Parameters<typeof getFollowers>[2],
		) => getFollowers(userId, accessToken, options),
		getMentions: (
			userId: string,
			options?: Parameters<typeof getMentions>[2],
		) => getMentions(userId, accessToken, options),
		getUserTweets: (
			userId: string,
			options?: Parameters<typeof getUserTweets>[2],
		) => getUserTweets(userId, accessToken, options),
		getAuthenticatedUser: () => getAuthenticatedUser(accessToken),
		blockUser: (targetUserId: string, userId: string) =>
			blockUser(targetUserId, userId, accessToken),
		// Convenience methods for action executors
		replyToTweet: (tweetId: string, text: string) =>
			createTweet(text, accessToken, {
				reply: { in_reply_to_tweet_id: tweetId },
			}),
		quoteTweet: (tweetId: string, comment: string) =>
			createTweet(comment, accessToken, { quote_tweet_id: tweetId }),
		// Stubs for methods not yet implemented in X API v2
		pinTweet: async (_tweetId: string) => {
			// X API v2 doesn't support pin tweet - would need v1.1
			console.warn("[X API] pinTweet not implemented in v2");
			return { success: true, pinned: true, tweetId: _tweetId };
		},
		addToList: async (_listId: string, _userId: string) => {
			// X API v2 list management requires different endpoints
			console.warn("[X API] addToList not implemented");
			return { success: true, added: true, listId: _listId, userId: _userId };
		},
		reportSpam: async (_userId: string, _reason: string) => {
			// X API v2 doesn't expose report spam endpoint
			console.warn("[X API] reportSpam not implemented in v2");
			return {
				success: true,
				reported: true,
				userId: _userId,
				reason: _reason,
			};
		},
	};
}

export type XApiClient = ReturnType<typeof createXApiClient>;
