/**
 * Retweet Extractor
 * 
 * Extracts retweet data from X API responses.
 * 
 * ## Usage
 * 
 * ```typescript
 * // Extract retweets for a specific tweet
 * const retweets = extractRetweets(apiResponse, "tweet123");
 * 
 * // Process retweets
 * for (const retweet of retweets) {
 *   console.log(`${retweet.retweeterScreenName} retweeted`);
 * }
 * ```
 */

import type { RapidApiRetweetsResponse, XRetweet } from "../../types/rapidapi";

/**
 * Extract retweets from RapidAPI response
 * 
 * @param data - RapidAPI retweets response
 * @param tweetId - ID of the tweet being retweeted
 * @returns Array of retweet objects
 */
export function extractRetweets(
	data: RapidApiRetweetsResponse,
	tweetId: string,
): XRetweet[] {
	try {
		const retweets: XRetweet[] = [];
		const instructions =
			data?.data?.retweeters_timeline?.timeline?.instructions || [];
		const totalRetweets = data?.data?.source_tweet?.legacy?.retweet_count || 0;

		for (const instruction of instructions) {
			if (instruction.type !== "TimelineAddEntries") continue;

			for (const entry of instruction.entries || []) {
				const userResult = entry?.content?.itemContent?.user_results?.result;
				if (!userResult) continue;

				const legacy = userResult.legacy;
				if (!legacy) continue;

				retweets.push({
					tweetId,
					retweeterId: userResult.rest_id,
					retweeterScreenName: legacy.screen_name,
					retweeterFollowersCount: legacy.followers_count || 0,
					totalRetweets,
				});
			}
		}

		return retweets;
	} catch (error) {
		console.error("Failed to extract retweets:", error);
		return [];
	}
}
