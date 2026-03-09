/**
 * X Tweet API Types
 * 
 * Type definitions for X (Twitter) tweet-related API operations.
 * Includes methods for creating, liking, retweeting, and quoting tweets.
 */

import type { XApiResponse, CreateTweetOptions } from "./x-api-base";

/**
 * X Tweet API interface
 * 
 * Provides methods for all tweet-related operations.
 * 
 * ## Usage
 * ```typescript
 * const client: XTweetApi = createXClient();
 * 
 * // Create a tweet
 * await client.createTweet("Hello world!");
 * 
 * // Reply to a tweet
 * await client.replyToTweet("tweetId", "Great point!");
 * 
 * // Retweet
 * await client.retweet("tweetId");
 * ```
 */
export interface XTweetApi {
	/**
	 * Create a new tweet
	 * 
	 * @param text - Tweet text content
	 * @param options - Optional tweet creation options (reply, quote)
	 * @returns API response with created tweet details
	 */
	createTweet: (text: string, options?: CreateTweetOptions) => Promise<XApiResponse>;

	/**
	 * Like a tweet
	 * 
	 * @param tweetId - ID of tweet to like
	 * @returns API response with like status
	 */
	likeTweet: (tweetId: string) => Promise<XApiResponse>;

	/**
	 * Retweet a tweet
	 * 
	 * @param tweetId - ID of tweet to retweet
	 * @returns API response with retweet details
	 */
	retweet: (tweetId: string) => Promise<XApiResponse>;

	/**
	 * Reply to a tweet
	 * 
	 * @param tweetId - ID of tweet to reply to
	 * @param text - Reply text content
	 * @returns API response with reply tweet details
	 */
	replyToTweet: (tweetId: string, text: string) => Promise<XApiResponse>;

	/**
	 * Quote a tweet with a comment
	 * 
	 * @param tweetId - ID of tweet to quote
	 * @param comment - Quote comment text
	 * @returns API response with quote tweet details
	 */
	quoteTweet: (tweetId: string, comment: string) => Promise<XApiResponse>;

	/**
	 * Pin a tweet to profile
	 * 
	 * @param tweetId - ID of tweet to pin
	 * @returns API response with pin status
	 */
	pinTweet: (tweetId: string) => Promise<XApiResponse>;
}
