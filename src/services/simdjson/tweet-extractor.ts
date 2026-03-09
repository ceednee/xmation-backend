/**
 * SIMDJSON Tweet Extractor
 * 
 * High-performance tweet extraction using simdjson parsing.
 * Optimized for extracting mentions and tweets from large API responses.
 * 
 * ## Usage
 * 
 * ```typescript
 * // Extract mentions from large JSON response
 * const mentions = extractMentionsSimd(jsonString);
 * 
 * // Extract single tweet
 * const tweet = extractTweetSimd(jsonString);
 * ```
 */

import type { XMention, XTweet } from "../../types/rapidapi";
import { parseJson } from "./parser";
import { getTimelineEntries } from "./timeline";
import { extractTweetResultFromEntry } from "./entry-extractor";
import { convertToMention, convertToTweet } from "./tweet-builder";

/**
 * Extract mentions from a JSON string using simdjson
 * 
 * Parses the JSON and extracts all mentions from timeline entries.
 * Optimized for large API responses.
 * 
 * @param jsonString - Raw JSON response
 * @returns Array of mention objects
 */
export function extractMentionsSimd(jsonString: string): XMention[] {
	try {
		const doc = parseJson(jsonString);
		const mentions: XMention[] = [];
		const entries = getTimelineEntries(doc);

		for (const entry of entries) {
			const tweetResult = extractTweetResultFromEntry(entry);
			if (!tweetResult) continue;

			const mention = convertToMention(tweetResult);
			if (mention) mentions.push(mention);
		}

		return mentions;
	} catch (error) {
		console.error("[simdjson] Failed to extract mentions:", error);
		return [];
	}
}

/**
 * Extract a single tweet from a JSON string using simdjson
 * 
 * @param jsonString - Raw JSON response containing a single tweet
 * @returns Tweet object or null if extraction fails
 */
export function extractTweetSimd(jsonString: string): XTweet | null {
	try {
		const doc = parseJson(jsonString);
		const tweet = (doc as any)?.data?.tweetResult;
		if (!tweet) return null;

		return convertToTweet(tweet);
	} catch (error) {
		console.error("[simdjson] Failed to extract tweet:", error);
		return null;
	}
}
