/**
 * Real X API Client
 * 
 * Production implementation of the X (Twitter) API client.
 * Makes actual HTTP calls to X API v2 endpoints using OAuth 2.0 tokens.
 * 
 * ## X API v2 Endpoints Used
 * 
 * | Method | Endpoint | Description |
 * |--------|----------|-------------|
 * | POST | /2/tweets | Create tweet |
 * | POST | /2/users/:id/likes | Like tweet |
 * | POST | /2/users/:id/retweets | Retweet |
 * | POST | /2/users/:id/following | Follow user |
 * | POST | /2/users/:id/blocking | Block user |
 * | POST | /2/dm_conversations | Send DM |
 * | POST | /2/users/:id/pinned_tweets | Pin tweet |
 * 
 * ## Rate Limits (Free Tier)
 * 
 * - Post tweets: 500/month
 * - Likes: 1000/day
 * - Retweets: 1000/day
 * - Follows: 400/day
 * - DMs: 1000/day
 * 
 * ## Usage
 * 
 * ```typescript
 * const tokens = await xTokenService.getValidTokens(userId);
 * const client = createRealXClient(tokens.accessToken, userId);
 * 
 * const result = await client.createTweet("Hello world!");
 * if (result.success) {
 *   console.log("Tweet posted:", result.data.id);
 * }
 * ```
 */

import type {
	XApiClient,
	XApiResponse,
	CreateTweetOptions,
	PaginationOptions,
} from "./types";

/**
 * X API Error with additional context
 */
class XApiError extends Error {
	constructor(
		message: string,
		public readonly statusCode: number,
		public readonly xErrorCode?: string,
	) {
		super(message);
		this.name = "XApiError";
	}
}

/**
 * Rate limit information from X API response
 */
interface RateLimitInfo {
	limit: number;
	remaining: number;
	resetTime: number;
}

/**
 * Parse rate limit headers from X API response
 */
function parseRateLimitHeaders(response: Response): RateLimitInfo | null {
	const limit = response.headers.get("x-rate-limit-limit");
	const remaining = response.headers.get("x-rate-limit-remaining");
	const reset = response.headers.get("x-rate-limit-reset");

	if (!limit || !remaining || !reset) {
		return null;
	}

	return {
		limit: Number.parseInt(limit, 10),
		remaining: Number.parseInt(remaining, 10),
		resetTime: Number.parseInt(reset, 10) * 1000, // Convert to ms
	};
}

/**
 * Make authenticated request to X API
 */
async function xApiRequest<T>(
	endpoint: string,
	accessToken: string,
	options: {
		method?: "GET" | "POST" | "DELETE";
		body?: Record<string, unknown>;
	} = {},
): Promise<XApiResponse> {
	const { method = "GET", body } = options;
	const url = `https://api.x.com${endpoint}`;

	try {
		const response = await fetch(url, {
			method,
			headers: {
				Authorization: `Bearer ${accessToken}`,
				"Content-Type": "application/json",
			},
			body: body ? JSON.stringify(body) : undefined,
		});

		const rateLimit = parseRateLimitHeaders(response);

		// Handle rate limiting
		if (response.status === 429) {
			const resetTime = rateLimit?.resetTime || Date.now() + 900000; // 15 min default
			const waitMinutes = Math.ceil((resetTime - Date.now()) / 60000);
			throw new XApiError(
				`Rate limit exceeded. Reset in ${waitMinutes} minutes.`,
				429,
				"RATE_LIMIT_EXCEEDED",
			);
		}

		// Handle authentication errors
		if (response.status === 401) {
			throw new XApiError(
				"Authentication failed. Token may be expired.",
				401,
				"UNAUTHORIZED",
			);
		}

		// Handle other errors
		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new XApiError(
				errorData.detail || `X API error: ${response.statusText}`,
				response.status,
				errorData.title,
			);
		}

		// Parse success response
		const data = await response.json();

		return {
			success: true,
			data: data.data as T,
			meta: data.meta,
			rateLimit: rateLimit || undefined,
		};
	} catch (error) {
		if (error instanceof XApiError) {
			return {
				success: false,
				error: error.message,
				errorCode: error.xErrorCode,
			};
		}

		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Unknown error calling X API",
		};
	}
}

/**
 * Create a real X API client instance
 * 
 * @param accessToken - Valid OAuth 2.0 access token
 * @param userId - The authenticated user's X ID (for endpoints like /2/users/:id/...)
 * @returns XApiClient implementation that makes real API calls
 */
export const createRealXClient = (
	accessToken: string,
	userId: string,
): XApiClient => {
	return {
		// ==================== Tweet Operations ====================

		/**
		 * Create a new tweet
		 * POST /2/tweets
		 */
		createTweet: async (
			text: string,
			options?: CreateTweetOptions,
		): Promise<XApiResponse> => {
			const body: Record<string, unknown> = { text };

			if (options?.reply?.in_reply_to_tweet_id) {
				body.reply = {
					in_reply_to_tweet_id: options.reply.in_reply_to_tweet_id,
				};
			}

			if (options?.quote_tweet_id) {
				body.quote_tweet_id = options.quote_tweet_id;
			}

			return xApiRequest("/2/tweets", accessToken, {
				method: "POST",
				body,
			});
		},

		/**
		 * Like a tweet
		 * POST /2/users/:id/likes
		 */
		likeTweet: async (tweetId: string): Promise<XApiResponse> => {
			return xApiRequest(`/2/users/${userId}/likes`, accessToken, {
				method: "POST",
				body: { tweet_id: tweetId },
			});
		},

		/**
		 * Retweet
		 * POST /2/users/:id/retweets
		 */
		retweet: async (tweetId: string): Promise<XApiResponse> => {
			return xApiRequest(`/2/users/${userId}/retweets`, accessToken, {
				method: "POST",
				body: { tweet_id: tweetId },
			});
		},

		/**
		 * Reply to a tweet (creates tweet with reply reference)
		 * POST /2/tweets
		 */
		replyToTweet: async (
			tweetId: string,
			text: string,
		): Promise<XApiResponse> => {
			return xApiRequest("/2/tweets", accessToken, {
				method: "POST",
				body: {
					text,
					reply: {
						in_reply_to_tweet_id: tweetId,
					},
				},
			});
		},

		/**
		 * Quote a tweet
		 * POST /2/tweets (with quote_tweet_id)
		 */
		quoteTweet: async (
			tweetId: string,
			comment: string,
		): Promise<XApiResponse> => {
			return xApiRequest("/2/tweets", accessToken, {
				method: "POST",
				body: {
					text: comment,
					quote_tweet_id: tweetId,
				},
			});
		},

		/**
		 * Pin a tweet to profile
		 * POST /2/users/:id/pinned_tweets
		 */
		pinTweet: async (tweetId: string): Promise<XApiResponse> => {
			return xApiRequest(`/2/users/${userId}/pinned_tweets`, accessToken, {
				method: "POST",
				body: { tweet_id: tweetId },
			});
		},

		// ==================== User Operations ====================

		/**
		 * Follow a user
		 * POST /2/users/:id/following
		 */
		followUser: async (targetUserId: string): Promise<XApiResponse> => {
			return xApiRequest(`/2/users/${userId}/following`, accessToken, {
				method: "POST",
				body: { target_user_id: targetUserId },
			});
		},

		/**
		 * Get followers (not typically used - RapidAPI preferred)
		 * GET /2/users/:id/followers
		 */
		getFollowers: async (
			userIdParam: string,
			_options?: PaginationOptions,
		): Promise<XApiResponse> => {
			// Note: This uses the passed userIdParam, not the authenticated userId
			// because you can view other users' followers
			return xApiRequest(
				`/2/users/${userIdParam}/followers`,
				accessToken,
			);
		},

		/**
		 * Get authenticated user info
		 * GET /2/users/me
		 */
		getAuthenticatedUser: async (): Promise<XApiResponse> => {
			return xApiRequest("/2/users/me", accessToken);
		},

		/**
		 * Block a user
		 * POST /2/users/:id/blocking
		 */
		blockUser: async (targetUserId: string): Promise<XApiResponse> => {
			return xApiRequest(`/2/users/${userId}/blocking`, accessToken, {
				method: "POST",
				body: { target_user_id: targetUserId },
			});
		},

		/**
		 * Add user to list
		 * POST /2/lists/:id/members
		 */
		addToList: async (listId: string, memberId: string): Promise<XApiResponse> => {
			return xApiRequest(`/2/lists/${listId}/members`, accessToken, {
				method: "POST",
				body: { user_id: memberId },
			});
		},

		/**
		 * Report spam
		 * POST /2/users/:id/reporting
		 */
		reportSpam: async (
			targetUserId: string,
			_reason: string,
		): Promise<XApiResponse> => {
			return xApiRequest(`/2/users/${userId}/reporting`, accessToken, {
				method: "POST",
				body: {
					target_user_id: targetUserId,
					report_type: "spam",
				},
			});
		},

		// ==================== Message Operations ====================

		/**
		 * Send a direct message
		 * POST /2/dm_conversations/with/:participant_id/messages
		 */
		sendDM: async (recipientId: string, text: string): Promise<XApiResponse> => {
			return xApiRequest(
				`/2/dm_conversations/with/${recipientId}/messages`,
				accessToken,
				{
					method: "POST",
					body: { text },
				},
			);
		},

		/**
		 * Get mentions (not typically used - RapidAPI preferred)
		 * GET /2/users/:id/mentions
		 */
		getMentions: async (
			userIdParam: string,
			_options?: PaginationOptions,
		): Promise<XApiResponse> => {
			return xApiRequest(
				`/2/users/${userIdParam}/mentions`,
				accessToken,
			);
		},

		/**
		 * Get user tweets (not typically used - RapidAPI preferred)
		 * GET /2/users/:id/tweets
		 */
		getUserTweets: async (
			userIdParam: string,
			_options?: PaginationOptions,
		): Promise<XApiResponse> => {
			return xApiRequest(
				`/2/users/${userIdParam}/tweets`,
				accessToken,
			);
		},
	};
};
