/**
 * Mention Extractor
 * 
 * Extracts mentions (tweets referencing the user) from X API responses.
 * 
 * ## Usage
 * 
 * ```typescript
 * // Extract mentions from API response
 * const mentions = extractMentions(apiResponse);
 * 
 * // Process mentions
 * for (const mention of mentions) {
 *   console.log(`${mention.authorScreenName}: ${mention.text}`);
 * }
 * ```
 */

import type { RapidApiMentionsResponse, XMention } from "../../types/rapidapi";
import { getTimelineEntries } from "./timeline";
import { extractTweetResultFromEntry, convertTweetResultToMention } from "./tweet-result";

/**
 * Extract mentions from RapidAPI response
 * 
 * @param data - RapidAPI mentions response
 * @returns Array of mention objects
 */
export function extractMentions(data: RapidApiMentionsResponse): XMention[] {
	try {
		const mentions: XMention[] = [];
		const entries = getTimelineEntries(data?.data?.timeline?.instructions || []);

		for (const entry of entries) {
			const tweetResult = extractTweetResultFromEntry(entry);
			if (!tweetResult) continue;

			const mention = convertTweetResultToMention(tweetResult);
			if (mention) mentions.push(mention);
		}

		return mentions;
	} catch (error) {
		console.error("Failed to extract mentions:", error);
		return [];
	}
}
