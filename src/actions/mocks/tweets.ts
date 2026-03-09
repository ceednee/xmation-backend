/**
 * X Tweet API Mock
 * 
 * Mock implementation of X (Twitter) tweet-related API operations.
 * Used for testing and dry-run mode without making actual API calls.
 */

import type { XApiResponse } from "../types";

/**
 * Creates a mock X tweet API client
 * 
 * Provides mock implementations for:
 * - Creating tweets
 * - Liking tweets
 * - Retweeting
 * - Replying to tweets
 * - Quoting tweets
 * - Pinning tweets
 * - Getting user tweets
 * 
 * @returns Mock tweet API client object
 * 
 * @example
 * ```typescript
 * const client = createMockTweetClient();
 * 
 * // Mock creating a tweet
 * const tweet = await client.createTweet("Hello world!");
 * // Returns: { success: true, data: { id: "mock_tweet_1234567890", text: "Hello world!" } }
 * 
 * // Mock replying to a tweet
 * const reply = await client.replyToTweet("123", "Great tweet!");
 * // Returns: { success: true, data: { id: "mock_reply_1234567890", text: "Great tweet!", replyTo: "123" } }
 * ```
 */
export const createMockTweetClient = () => ({
	/**
	 * Mock create tweet
	 * @param text - Tweet text
	 * @returns Mock tweet response
	 */
	createTweet: async (text: string): Promise<XApiResponse> => ({
		success: true,
		data: { id: `mock_tweet_${Date.now()}`, text },
	}),

	/**
	 * Mock like tweet
	 * @param tweetId - Tweet ID to like
	 * @returns Mock like response
	 */
	likeTweet: async (tweetId: string): Promise<XApiResponse> => ({
		success: true,
		data: { liked: true, tweetId },
	}),

	/**
	 * Mock retweet
	 * @param tweetId - Tweet ID to retweet
	 * @returns Mock retweet response
	 */
	retweet: async (tweetId: string): Promise<XApiResponse> => ({
		success: true,
		data: { retweeted: true, tweetId },
	}),

	/**
	 * Mock reply to tweet
	 * @param tweetId - Tweet ID to reply to
	 * @param text - Reply text
	 * @returns Mock reply response
	 */
	replyToTweet: async (tweetId: string, text: string): Promise<XApiResponse> => ({
		success: true,
		data: { id: `mock_reply_${Date.now()}`, text, replyTo: tweetId },
	}),

	/**
	 * Mock quote tweet
	 * @param tweetId - Tweet ID to quote
	 * @param comment - Quote comment
	 * @returns Mock quote response
	 */
	quoteTweet: async (tweetId: string, comment: string): Promise<XApiResponse> => ({
		success: true,
		data: {
			id: `mock_quote_${Date.now()}`,
			text: comment,
			quoteOf: tweetId,
		},
	}),

	/**
	 * Mock pin tweet
	 * @param tweetId - Tweet ID to pin
	 * @returns Mock pin response
	 */
	pinTweet: async (tweetId: string): Promise<XApiResponse> => ({
		success: true,
		data: { pinned: true, tweetId },
	}),

	/**
	 * Mock get user tweets
	 * @returns Empty tweets list
	 */
	getUserTweets: async (): Promise<XApiResponse> => ({
		success: true,
		data: [],
		meta: {},
	}),
});
