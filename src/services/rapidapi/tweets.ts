/**
 * Tweets API Endpoints
 * 
 * X tweet-related API endpoints.
 * 
 * ## Usage
 * 
 * ```typescript
 * // Get a tweet by ID
 * const tweet = await getTweet("123456");
 * 
 * // Get replies to a tweet
 * const replies = await getReplies("123456", "20");
 * 
 * // Search tweets
 * const results = await searchTweets("javascript", "20", "Latest");
 * ```
 */

import { rapidApiRequest } from "./request";

/**
 * Get a tweet by its ID
 * 
 * @param tweetId - Tweet ID
 * @returns Tweet data
 */
export const getTweet = (tweetId: string): Promise<unknown> =>
	rapidApiRequest("/tweet-v2", { pid: tweetId });

/**
 * Get replies to a tweet
 * 
 * @param tweetId - Tweet ID to get replies for
 * @param count - Number of replies to fetch (default: "20")
 * @returns Replies data
 */
export const getReplies = (tweetId: string, count = "20"): Promise<unknown> =>
	rapidApiRequest("/comments-v2", { pid: tweetId, count, rankingMode: "Relevance" });

/**
 * Search for tweets
 * 
 * @param query - Search query
 * @param count - Number of results (default: "20")
 * @param type - Search type: "Latest" or "Top" (default: "Latest")
 * @returns Search results
 */
export const searchTweets = (query: string, count = "20", type = "Latest"): Promise<unknown> =>
	rapidApiRequest("/search-v2", { q: query, count, type });
