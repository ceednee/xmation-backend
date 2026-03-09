/**
 * Engagement Calculator
 * 
 * Calculates engagement metrics for tweets.
 * 
 * ## Usage
 * 
 * ```typescript
 * // Calculate engagement for a tweet
 * const engagement = calculateEngagement(tweet);
 * console.log(engagement.total);  // total engagements
 * console.log(engagement.likes);  // likes count
 * 
 * // Find last post time from tweets
 * const lastTime = findLastPostTime(tweets);
 * ```
 */

import type { XTweet } from "../../types/rapidapi";

/**
 * Calculate engagement metrics for a tweet
 * 
 * @param tweet - Tweet to analyze
 * @returns Engagement metrics including likes, replies, retweets, quotes, total, and views
 */
export function calculateEngagement(tweet: XTweet): {
	likes: number;
	replies: number;
	retweets: number;
	quotes: number;
	total: number;
	views?: number;
} {
	const likes = tweet.favoriteCount || 0;
	const replies = tweet.replyCount || 0;
	const retweets = tweet.retweetCount || 0;
	const quotes = tweet.quoteCount || 0;
	const views = tweet.views ? Number.parseInt(tweet.views, 10) : undefined;

	return {
		likes,
		replies,
		retweets,
		quotes,
		total: likes + replies + retweets + quotes,
		views,
	};
}

/**
 * Find the timestamp of the most recent post
 * 
 * @param tweets - Array of tweets
 * @returns Timestamp of latest post, or undefined if empty
 */
export function findLastPostTime(tweets: XTweet[]): number | undefined {
	if (tweets.length === 0) return undefined;
	const timestamps = tweets.map((t) => new Date(t.createdAt).getTime());
	return Math.max(...timestamps);
}
