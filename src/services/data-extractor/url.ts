/**
 * URL Extractor
 * 
 * Extracts URLs from user bios and tweets.
 * 
 * ## Usage
 * 
 * ```typescript
 * // Extract all URLs from user and their tweets
 * const urls = extractAllUrls(user, tweets);
 * 
 * // Process URLs
 * for (const url of urls) {
 *   console.log(`${url.source}: ${url.url}`);
 * }
 * ```
 */

import type { XUser, XTweet } from "../../types/rapidapi";

/**
 * Extract all URLs from user profile and tweets
 * 
 * @param user - User object
 * @param tweets - Array of user's tweets
 * @returns Array of URL objects with source information
 */
export function extractAllUrls(
	user: XUser,
	tweets: XTweet[],
): Array<{ url: string; source: "bio" | "tweet"; tweetId?: string }> {
	const urls: Array<{ url: string; source: "bio" | "tweet"; tweetId?: string }> = [];

	if (user.url) {
		urls.push({ url: user.url, source: "bio" });
	}

	for (const tweet of tweets) {
		for (const urlEntity of tweet.urls) {
			urls.push({
				url: urlEntity.expandedUrl,
				source: "tweet",
				tweetId: tweet.restId,
			});
		}
	}

	return urls;
}
