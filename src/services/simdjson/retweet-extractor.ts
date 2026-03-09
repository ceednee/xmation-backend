/**
 * SIMDJSON Retweet Extractor
 * 
 * High-performance retweet extraction using simdjson parsing.
 * 
 * ## Usage
 * 
 * ```typescript
 * // Extract retweets for a specific tweet
 * const retweets = extractRetweetsSimd(jsonString, "tweetId123");
 * 
 * for (const retweet of retweets) {
 *   console.log(retweet.retweeterScreenName);
 * }
 * ```
 */

import { parseJson } from "./parser";
import { getRetweeterTimelineEntries, getTotalRetweets } from "./timeline";

/** Retweet result structure */
interface RetweetResult {
	tweetId: string;
	retweeterId: string;
	retweeterScreenName: string;
	retweeterFollowersCount: number;
	totalRetweets: number;
}

/** Raw user result from API */
interface UserResult {
	rest_id?: string;
	legacy?: {
		screen_name?: string;
		followers_count?: number;
	};
}

/**
 * Convert user result to retweet format
 * 
 * @param userResult - Raw user result from API
 * @param tweetId - ID of the tweet being retweeted
 * @param totalRetweets - Total retweet count
 * @returns Retweet result or null if invalid
 */
const convertUserResultToRetweet = (
	userResult: UserResult,
	tweetId: string,
	totalRetweets: number
): RetweetResult | null => {
	const legacy = userResult.legacy;
	if (!legacy) return null;

	return {
		tweetId,
		retweeterId: String(userResult.rest_id),
		retweeterScreenName: String(legacy.screen_name),
		retweeterFollowersCount: Number(legacy.followers_count) || 0,
		totalRetweets,
	};
};

/**
 * Extract retweets from a JSON string using simdjson
 * 
 * @param jsonString - Raw JSON response
 * @param tweetId - ID of the tweet to extract retweets for
 * @returns Array of retweet objects
 */
export function extractRetweetsSimd(jsonString: string, tweetId: string): RetweetResult[] {
	try {
		const doc = parseJson(jsonString);
		const retweets: RetweetResult[] = [];
		const entries = getRetweeterTimelineEntries(doc);
		const totalRetweets = getTotalRetweets(doc);

		for (const entry of entries) {
			const userResult = (entry as any)?.content?.itemContent?.user_results?.result;
			if (!userResult) continue;

			const retweet = convertUserResultToRetweet(userResult, tweetId, totalRetweets);
			if (retweet) retweets.push(retweet);
		}

		return retweets;
	} catch (error) {
		console.error("[simdjson] Failed to extract retweets:", error);
		return [];
	}
}
